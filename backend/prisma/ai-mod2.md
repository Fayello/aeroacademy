# Module 2 — MLOps Pipeline

## The Pipeline Is the Product

A machine learning model that lives in a notebook is a proof of concept. A machine learning model in production is a system, and systems need pipelines. The pipeline is what transforms raw data into predictions at scale, and it is what makes your model maintainable, reproducible, and debuggable when things go wrong—and things will go wrong.

This module walks through building an end-to-end ML pipeline that handles data ingestion, feature engineering, model training, evaluation, and deployment. You will use tools that are standard in production environments: Apache Airflow for orchestration, MLflow for experiment tracking, and feature stores for managing feature computation. The goal is not to learn every tool in the ecosystem but to understand the architecture of a production ML system and the failure modes you must guard against.

The core principle of MLOps is that ML systems are software systems, and they deserve the same engineering rigor as any other production software. This means version control for code and data, automated testing, continuous integration, monitoring, and incident response. The difference is that ML systems have additional failure modes related to data quality, model degradation, and statistical drift that traditional software does not face.

## Data Ingestion: Getting Clean Data at Scale

Real data does not arrive in a clean CSV. It arrives in databases with schema changes, APIs that time out, event streams with duplicates, and S3 buckets with inconsistent file formats. Your pipeline must handle all of this gracefully.

The first principle of data ingestion is idempotency. Running the same ingestion step twice should produce the same result. If your pipeline reads data from a database and appends it to a file, running it twice doubles the data. If it overwrites the file, running it twice is fine. Design every step to be safe to re-run.

The second principle is validation. Data quality issues at the source propagate through the entire pipeline and corrupt your model. A null value in a critical feature, a type mismatch, or an out-of-range value can cause silent failures that degrade model performance without triggering errors. Validate early and fail loudly.

The third principle is lineage. Every row of data should be traceable back to its source. When you discover that a batch of data was corrupted, you need to know exactly which training runs used that data and which models were affected. Lineage tracking is not optional in production—it is the difference between a targeted fix and a full retraining.

```python
import pandas as pd
import hashlib
from datetime import datetime
from pathlib import Path

class DataIngestion:
    def __init__(self, raw_path: str, processed_path: str):
        self.raw_path = Path(raw_path)
        self.processed_path = Path(processed_path)
        self.processed_path.mkdir(parents=True, exist_ok=True)
    
    def load_raw_data(self, source: str) -> pd.DataFrame:
        if source.endswith('.csv'):
            df = pd.read_csv(source)
        elif source.endswith('.parquet'):
            df = pd.read_parquet(source)
        else:
            raise ValueError(f"Unsupported format: {source}")
        
        df['_ingestion_timestamp'] = datetime.utcnow()
        df['_source_file'] = source
        df['_row_hash'] = df.apply(
            lambda row: hashlib.md5(
                row.to_json().encode()
            ).hexdigest(), axis=1
        )
        
        return df
    
    def detect_schema_changes(self, df: pd.DataFrame, reference_schema: dict):
        current_schema = {col: str(dtype) for col, dtype in df.dtypes.items()}
        changes = []
        
        new_cols = set(current_schema.keys()) - set(reference_schema.keys())
        removed_cols = set(reference_schema.keys()) - set(current_schema.keys())
        type_changes = {
            col for col in set(current_schema.keys()) & set(reference_schema.keys())
            if current_schema[col] != reference_schema[col]
        }
        
        if new_cols:
            changes.append(f"New columns: {new_cols}")
        if removed_cols:
            changes.append(f"Removed columns: {removed_cols}")
        if type_changes:
            changes.append(f"Type changes: {type_changes}")
        
        return changes
    
    def deduplicate(self, df: pd.DataFrame) -> pd.DataFrame:
        initial_count = len(df)
        df = df.drop_duplicates(subset=['_row_hash'], keep='last')
        removed = initial_count - len(df)
        if removed > 0:
            print(f"Removed {removed} duplicate rows")
        return df
    
    def validate_data(self, df: pd.DataFrame) -> bool:
        checks = {
            'no_empty_dataframe': len(df) > 0,
            'required_columns_present': all(
                col in df.columns 
                for col in ['amount', 'user_id', 'timestamp']
            ),
            'amount_positive': (df['amount'] > 0).all(),
            'no_future_timestamps': (
                pd.to_datetime(df['timestamp']) <= datetime.utcnow()
            ).all(),
        }
        
        failed = [name for name, passed in checks.items() if not passed]
        if failed:
            print(f"Data validation failed: {failed}")
            return False
        return True
    
    def run(self, source: str):
        df = self.load_raw_data(source)
        
        if not self.validate_data(df):
            raise ValueError("Data validation failed")
        
        df = self.deduplicate(df)
        
        output_path = self.processed_path / f"raw_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.parquet"
        df.to_parquet(output_path, index=False)
        print(f"Ingested {len(df)} rows to {output_path}")
        
        return df

ingestion = DataIngestion('data/raw', 'data/processed')
df = ingestion.run('transactions.csv')
```

The `_row_hash` column is critical for deduplication. It creates a hash of every row's content, so you can detect exact duplicates even if they arrived at different times or from different sources. The schema change detection catches upstream database migrations that might break your pipeline.

The validation checks catch the most common data quality issues. Empty dataframes break downstream code. Missing required columns cause KeyError exceptions. Negative amounts indicate data corruption. Future timestamps indicate clock skew or timezone issues. Each check has a clear failure message so you can diagnose the problem quickly.

## Feature Engineering at Scale

Feature engineering in production is fundamentally different from feature engineering in a notebook. In a notebook, you compute features on a static dataset. In production, you need to compute features on new data in real-time or in batch, and you need the exact same feature computation logic to apply during training and serving.

This is where feature stores come in. A feature store is a centralized repository for computed features that provides consistent access across training and serving. It solves the training-serving skew problem—the silent killer of ML systems. Training-serving skew occurs when the features used during training differ from the features used during serving. The model was trained on one set of feature values and receives different values in production. The predictions are unreliable, but no error is thrown.

Feature stores solve this by providing a single source of truth for feature computation. During training, you compute features from historical data and store them in the feature store. During serving, you compute features from real-time data using the same logic and store them in the same feature store. The model always reads from the same location, ensuring consistency.

```python
from datetime import timedelta
import numpy as np
from scipy import stats

class FeatureEngineer:
    def __init__(self, lookback_windows: list[int] = None):
        self.lookback_windows = lookback_windows or [7, 30, 90]
        self.feature_stats = {}
    
    def compute_user_features(self, df: pd.DataFrame) -> pd.DataFrame:
        features = []
        
        for user_id, user_df in df.groupby('user_id'):
            user_df = user_df.sort_values('timestamp')
            
            for window in self.lookback_windows:
                window_df = user_df.tail(window)
                
                features.append({
                    'user_id': user_id,
                    f'txn_count_{window}d': len(window_df),
                    f'avg_amount_{window}d': window_df['amount'].mean(),
                    f'std_amount_{window}d': window_df['amount'].std(),
                    f'max_amount_{window}d': window_df['amount'].max(),
                    f'min_amount_{window}d': window_df['amount'].min(),
                    f'unique_merchants_{window}d': window_df['merchant_id'].nunique(),
                    f'txn_frequency_{window}d': len(window_df) / window,
                })
            
            # Trend features
            if len(user_df) >= 14:
                recent_avg = user_df.tail(7)['amount'].mean()
                older_avg = user_df.iloc[-14:-7]['amount'].mean()
                features[-1]['amount_trend_7d'] = (recent_avg - older_avg) / (older_avg + 1e-8)
            
            # Statistical features
            features[-1]['amount_skew'] = stats.skew(user_df['amount'].values)
            features[-1]['amount_kurtosis'] = stats.kurtosis(user_df['amount'].values)
        
        return pd.DataFrame(features).fillna(0)
    
    def compute_merchant_features(self, df: pd.DataFrame) -> pd.DataFrame:
        merchant_stats = df.groupby('merchant_id').agg(
            merchant_avg_amount=('amount', 'mean'),
            merchant_std_amount=('amount', 'std'),
            merchant_txn_count=('amount', 'count'),
            merchant_unique_users=('user_id', 'nunique'),
            merchant_fraud_rate=('is_fraud', 'mean'),
        ).reset_index()
        
        return merchant_stats
    
    def compute_interaction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df['amount_deviation'] = (
            (df['amount'] - df['merchant_avg_amount']) / 
            (df['merchant_std_amount'] + 1e-8)
        )
        df['user_merchant_frequency'] = df.groupby(
            ['user_id', 'merchant_id']
        )['amount'].transform('count')
        df['is_new_merchant'] = (df['user_merchant_frequency'] == 1).astype(int)
        
        return df
    
    def store_features(self, features: pd.DataFrame, feature_group: str):
        output_path = Path(f'features/{feature_group}')
        output_path.mkdir(parents=True, exist_ok=True)
        
        features.to_parquet(
            output_path / f'latest.parquet', index=False
        )
        
        self.feature_stats[feature_group] = {
            'row_count': len(features),
            'columns': list(features.columns),
            'computed_at': datetime.utcnow().isoformat()
        }
    
    def run(self, df: pd.DataFrame):
        user_features = self.compute_user_features(df)
        merchant_features = self.compute_merchant_features(df)
        
        df = df.merge(user_features, on='user_id', how='left')
        df = df.merge(merchant_features, on='merchant_id', how='left')
        df = self.compute_interaction_features(df)
        
        self.store_features(user_features, 'user_features')
        self.store_features(merchant_features, 'merchant_features')
        
        return df

feature_engineer = FeatureEngineer(lookback_windows=[7, 30, 90])
engineered_df = feature_engineer.run(df)
```

The lookback windows (7, 30, 90 days) give the model both short-term and long-term behavioral signals. A spike in transaction frequency in the last 7 days, combined with a low 90-day average, might indicate account compromise. These temporal features are the kind of signal that raw transaction amounts cannot provide.

The trend feature `amount_trend_7d` captures whether the user's spending is increasing or decreasing. An increasing trend might indicate normal behavior (approaching payday) or abnormal behavior (account compromise). The model learns which interpretation is correct based on other features.

Statistical features like skewness and kurtosis capture the shape of the user's spending distribution. A user with normally distributed spending is different from a user with highly skewed spending. These distributional features provide signal that point estimates (mean, median) cannot capture.

## Experiment Tracking: Every Run Must Be Reproducible

When you train a model, you need to record exactly what you did: the code version, the data version, the hyperparameters, the metrics, and the artifacts. Without this, you cannot reproduce your results, and you cannot explain to a stakeholder why one model is better than another.

MLflow is the standard tool for this. It tracks experiments, logs parameters and metrics, and stores model artifacts. But the tool is less important than the discipline. You must log everything, every time, without exception. The most common failure in ML systems is not a technical failure—it is a documentation failure. Someone trains a great model, forgets to log the parameters, and two weeks later cannot reproduce it.

The experiment tracking system must capture four things. First, the code version—what git commit produced this model. Second, the data version—what dataset was used. Third, the configuration—what hyperparameters and preprocessing steps were applied. Fourth, the results—what metrics were achieved. Without any one of these, the experiment is unreproducible.

```python
import mlflow
import mlflow.sklearn
from sklearn.model_selection import cross_val_score

def train_and_track_model(
    model, X_train, y_train, X_test, y_test,
    experiment_name: str, run_name: str, params: dict
):
    mlflow.set_experiment(experiment_name)
    
    with mlflow.start_run(run_name=run_name):
        # Log parameters
        mlflow.log_params(params)
        mlflow.log_param("train_size", len(X_train))
        mlflow.log_param("test_size", len(X_test))
        mlflow.log_param("n_features", X_train.shape[1])
        
        # Train
        model.fit(X_train, y_train)
        
        # Cross-validation
        cv_scores = cross_val_score(
            model, X_train, y_train, cv=5, scoring='f1'
        )
        mlflow.log_metric("cv_f1_mean", cv_scores.mean())
        mlflow.log_metric("cv_f1_std", cv_scores.std())
        
        # Test set evaluation
        y_pred = model.predict(X_test)
        y_proba = model.predict_proba(X_test)[:, 1]
        
        test_f1 = f1_score(y_test, y_pred)
        test_precision = precision_score(y_test, y_pred)
        test_recall = recall_score(y_test, y_pred)
        test_roc_auc = roc_auc_score(y_test, y_proba)
        
        mlflow.log_metric("test_f1", test_f1)
        mlflow.log_metric("test_precision", test_precision)
        mlflow.log_metric("test_recall", test_recall)
        mlflow.log_metric("test_roc_auc", test_roc_auc)
        
        # Log model
        mlflow.sklearn.log_model(
            model, "model",
            registered_model_name="fraud_detector"
        )
        
        # Log data version
        mlflow.log_artifact("data/processed/latest.parquet")
        
        return {
            'cv_f1': cv_scores.mean(),
            'test_f1': test_f1,
            'test_precision': test_precision,
            'test_recall': test_recall
        }

results = train_and_track_model(
    model=GradientBoostingClassifier(n_estimators=200, max_depth=5),
    X_train=X_train, y_train=y_train,
    X_test=X_test, y_test=y_test,
    experiment_name="fraud_detection",
    run_name="gb_tuning_v3",
    params={"n_estimators": 200, "max_depth": 5, "learning_rate": 0.1}
)
```

The `registered_model_name` parameter registers the model in MLflow's model registry. This is how you track which model version is in production, which is in staging, and which has been retired. Without a model registry, you end up with a directory of model files named `model_v3_final_FINAL.pkl` and no idea which one is actually deployed.

Cross-validation scores are logged alongside test set scores. This lets you compare offline and online performance. If cross-validation says F1 is 0.85 but the test set says 0.72, something has changed—either the data distribution has shifted or there is data leakage in your cross-validation procedure.

## Building the Orchestration Layer

An ML pipeline is a sequence of steps that must execute in a specific order, with dependencies between them. Airflow orchestrates these steps as a Directed Acyclic Graph (DAG). Each task in the DAG is a Python function that can run independently, and Airflow handles scheduling, retries, and failure notifications.

The key design principle for Airflow DAGs is that each task should be atomic. If a task fails, it should be safe to retry without side effects. This means each task should write its output to a unique location (usually timestamped) and read its input from the most recent successful output of the previous task. This avoids partial writes and stale data issues.

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.utils.dates import days_ago
from datetime import timedelta

default_args = {
    'owner': 'ml-team',
    'depends_on_past': False,
    'email_on_failure': True,
    'email': ['ml-alerts@company.com'],
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
    'execution_timeout': timedelta(hours=2),
}

def ingest_data(**context):
    ingestion = DataIngestion('data/raw', 'data/processed')
    df = ingestion.run('transactions.csv')
    context['ti'].xcom_push(key='row_count', value=len(df))

def engineer_features(**context):
    row_count = context['ti'].xcom_pull(
        task_ids='ingest_data', key='row_count'
    )
    print(f"Processing {row_count} rows")
    
    feature_engineer = FeatureEngineer()
    df = pd.read_parquet('data/processed/latest.parquet')
    engineered_df = feature_engineer.run(df)
    
    engineered_df.to_parquet('data/processed/engineered.parquet', index=False)

def train_model(**context):
    df = pd.read_parquet('data/processed/engineered.parquet')
    # ... training logic ...

def evaluate_model(**context):
    # ... evaluation logic ...
    metrics = {}  # from evaluation
    
    if metrics.get('test_f1', 0) < 0.7:
        raise ValueError(f"F1 score {metrics['test_f1']:.4f} below threshold")

def deploy_model(**context):
    # ... deployment logic ...

dag = DAG(
    'fraud_detection_pipeline',
    default_args=default_args,
    description='End-to-end fraud detection pipeline',
    schedule_interval='0 2 * * *',  # Daily at 2 AM
    start_date=days_ago(1),
    catchup=False,
    max_active_runs=1,
)

ingest = PythonOperator(
    task_id='ingest_data',
    python_callable=ingest_data,
    dag=dag,
)

features = PythonOperator(
    task_id='engineer_features',
    python_callable=engineer_features,
    dag=dag,
)

train = PythonOperator(
    task_id='train_model',
    python_callable=train_model,
    dag=dag,
)

evaluate = PythonOperator(
    task_id='evaluate_model',
    python_callable=evaluate_model,
    dag=dag,
)

deploy = PythonOperator(
    task_id='deploy_model',
    python_callable=deploy_model,
    dag=dag,
)

ingest >> features >> train >> evaluate >> deploy
```

The `max_active_runs=1` parameter prevents multiple pipeline runs from overlapping. If the daily run takes longer than 24 hours, Airflow skips the next run rather than starting a second one in parallel. The `execution_timeout` kills tasks that hang, preventing a stuck step from consuming cluster resources indefinitely.

XCom (cross-communication) passes data between tasks. The ingestion task pushes the row count, and the feature engineering task pulls it. This is for metadata only—large datasets should be passed through files or a feature store, not through XCom, which has size limits.

The `catchup=False` parameter prevents Airflow from running all missed runs since the start date. Without it, if the DAG has been offline for a week, Airflow would try to run seven backfills simultaneously, which can overwhelm your cluster.

## Data Versioning: DVC and Data Lineage

Code versioning with Git is not enough. You also need to version your data. Data Version Control (DVC) tracks data files alongside your Git repository without storing the actual data in Git. It stores metadata files that point to the actual data in remote storage (S3, GCS, etc.).

DVC also supports pipeline reproduction. If you define your pipeline in a `dvc.yaml` file, DVC can track which stages need to be re-run based on changes to code or data. This is how you ensure that your feature engineering code and your model training code are always in sync with the data they were designed for.

```bash
# Initialize DVC in your project
dvc init

# Track your dataset
dvc add data/transactions.csv

# Add the DVC file to Git
git add data/transactions.csv.dvc .gitignore
git commit -m "Add initial transaction dataset"

# Configure remote storage
dvc remote add -d storage s3://my-bucket/ml-data

# When data changes
dvc add data/transactions.csv
git add data/transactions.csv.dvc
git commit -m "Update transaction dataset v2"

# To reproduce a specific version
git checkout <commit-hash>
dvc checkout
```

The workflow is: you commit code changes to Git and data changes to DVC. The `.dvc` files in Git point to the actual data in remote storage. When you check out a specific commit, you also check out the corresponding data version. This ensures that your code and data are always in sync.

## The Full Pipeline in Production

Putting it all together, the production pipeline runs on a schedule, handles failures gracefully, and produces artifacts that are versioned and reproducible. The pipeline consists of five stages: ingestion, feature engineering, training, evaluation, and deployment.

Each stage writes its outputs to a specific location with a timestamp. Each stage reads its inputs from the previous stage's output. If any stage fails, the pipeline stops, alerts are sent, and the previous day's model continues serving predictions. This is the "last known good" pattern—if the new pipeline fails, the old model is better than no model.

```python
class ProductionPipeline:
    def __init__(self, config: dict):
        self.config = config
        self.ingestion = DataIngestion(
            config['raw_path'], config['processed_path']
        )
        self.feature_engineer = FeatureEngineer(
            config['lookback_windows']
        )
        self.run_id = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    
    def run(self):
        try:
            # Stage 1: Ingestion
            print(f"[{self.run_id}] Starting ingestion")
            df = self.ingestion.run(self.config['source'])
            
            # Stage 2: Feature Engineering
            print(f"[{self.run_id}] Computing features")
            engineered_df = self.feature_engineer.run(df)
            
            # Stage 3: Training
            print(f"[{self.run_id}] Training model")
            model, metrics = self.train(engineered_df)
            
            # Stage 4: Evaluation
            print(f"[{self.run_id}] Evaluating model")
            if not self.evaluate(metrics):
                raise ValueError("Model below quality threshold")
            
            # Stage 5: Deployment
            print(f"[{self.run_id}] Deploying model")
            self.deploy(model, metrics)
            
            print(f"[{self.run_id}] Pipeline complete")
            return True
            
        except Exception as e:
            print(f"[{self.run_id}] Pipeline failed: {e}")
            self.alert(str(e))
            return False
    
    def train(self, df):
        X = df.drop(['is_fraud', '_ingestion_timestamp'], axis=1)
        y = df['is_fraud']
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, stratify=y, random_state=42
        )
        
        model = GradientBoostingClassifier(
            n_estimators=200, max_depth=5, random_state=42
        )
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        metrics = {
            'f1': f1_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred),
        }
        
        return model, metrics
    
    def evaluate(self, metrics: dict) -> bool:
        threshold = self.config.get('min_f1', 0.70)
        return metrics['f1'] >= threshold
    
    def deploy(self, model, metrics):
        model_path = f"models/{self.run_id}/model.pkl"
        Path(model_path).parent.mkdir(parents=True, exist_ok=True)
        
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        
        # Update the "current" symlink
        current_path = Path('models/current')
        if current_path.exists():
            current_path.unlink()
        current_path.symlink_to(Path(model_path).parent)
        
        # Log to experiment tracker
        self.log_deployment(model_path, metrics)
    
    def log_deployment(self, model_path, metrics):
        mlflow.log_metric("deployed_f1", metrics['f1'])
        mlflow.log_param("deployed_model", model_path)
    
    def alert(self, message: str):
        # Send alert via email, Slack, PagerDuty, etc.
        print(f"ALERT: {message}")

pipeline = ProductionPipeline({
    'raw_path': 'data/raw',
    'processed_path': 'data/processed',
    'source': 'transactions.csv',
    'lookback_windows': [7, 30, 90],
    'min_f1': 0.70,
})

pipeline.run()
```

The symlink pattern (`models/current`) is how your serving infrastructure knows which model to load. When a new model is deployed, the symlink updates atomically. The serving code always reads from `models/current`, and it never sees a partially-written model directory.

The evaluation gate (`min_f1`) prevents bad models from reaching production. If the new model's F1 score is below the threshold, the pipeline fails and the previous model continues serving. This is a simple but effective quality gate that prevents regressions from reaching users.

## Pipeline Testing and Validation

ML pipelines are harder to test than traditional software because they involve data, models, and statistical outputs. A unit test that checks whether a function returns the correct value is not sufficient. You need tests that verify data distributions, feature computations, and model quality.

The testing pyramid for ML has four layers. Unit tests verify individual functions (does `compute_user_features()` return the expected columns?). Integration tests verify that pipeline stages work together (does the output of ingestion feed correctly into feature engineering?). Data tests verify data quality (does the training data have the expected schema, range, and distribution?). Model tests verify model quality (does the trained model meet minimum performance thresholds?).

```python
import pytest
import pandas as pd
import numpy as np
from datetime import datetime

class TestDataIngestion:
    @pytest.fixture
    def sample_data(self):
        return pd.DataFrame({
            'amount': [100, 200, 300, -50, 1000],
            'user_id': ['u1', 'u2', 'u1', 'u3', 'u2'],
            'timestamp': pd.date_range('2024-01-01', periods=5),
            'merchant_id': ['m1', 'm2', 'm1', 'm3', 'm2'],
        })
    
    def test_no_empty_dataframe(self, sample_data):
        assert len(sample_data) > 0
    
    def test_required_columns(self, sample_data):
        required = ['amount', 'user_id', 'timestamp']
        for col in required:
            assert col in sample_data.columns
    
    def test_amount_positive(self, sample_data):
        # Allow negative amounts in test data for validation testing
        pass
    
    def test_deduplication(self, sample_data):
        ingestion = DataIngestion('data/raw', 'data/processed')
        df = sample_data.copy()
        df = pd.concat([df, df.iloc[:2]], ignore_index=True)
        deduped = ingestion.deduplicate(df)
        assert len(deduped) == len(sample_data)

class TestFeatureEngineering:
    @pytest.fixture
    def engineered_data(self):
        df = pd.DataFrame({
            'user_id': ['u1'] * 10,
            'amount': np.random.exponential(100, 10),
            'timestamp': pd.date_range('2024-01-01', periods=10),
            'merchant_id': ['m1'] * 5 + ['m2'] * 5,
        })
        feature_engineer = FeatureEngineer(lookback_windows=[7])
        return feature_engineer.run(df)
    
    def test_user_features_computed(self, engineered_data):
        assert 'txn_count_7d' in engineered_data.columns
        assert 'avg_amount_7d' in engineered_data.columns
    
    def test_no_nan_in_features(self, engineered_data):
        numeric_cols = engineered_data.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            assert not engineered_data[col].isna().any(), f"NaN found in {col}"
    
    def test_feature_values_reasonable(self, engineered_data):
        assert (engineered_data['txn_count_7d'] >= 0).all()
        assert (engineered_data['avg_amount_7d'] >= 0).all()

class TestPipelineIntegration:
    def test_end_to_end(self):
        pipeline = ProductionPipeline({
            'raw_path': 'data/raw',
            'processed_path': 'data/processed',
            'source': 'test_data.csv',
            'lookback_windows': [7, 30],
            'min_f1': 0.5,
        })
        
        result = pipeline.run()
        assert result is True
    
    def test_pipeline_idempotent(self):
        pipeline = ProductionPipeline({...})
        result1 = pipeline.run()
        result2 = pipeline.run()
        # Both should succeed
        assert result1 is True
        assert result2 is True

class TestModelQuality:
    def test_model_above_threshold(self, trained_model, test_data):
        y_pred = trained_model.predict(test_data['X'])
        f1 = f1_score(test_data['y'], y_pred)
        assert f1 >= 0.70, f"F1 score {f1:.4f} below threshold"
    
    def test_no_prediction_leakage(self, model, train_data, test_data):
        train_pred = model.predict(train_data['X'])
        test_pred = model.predict(test_data['X'])
        
        train_f1 = f1_score(train_data['y'], train_pred)
        test_f1 = f1_score(test_data['y'], test_pred)
        
        # Test should not be significantly better than train
        assert test_f1 >= train_f1 * 0.8, "Possible data leakage"
```

The data tests are particularly important. They catch issues that traditional unit tests miss. A function can return the correct output for a given input but produce incorrect results when the data distribution changes. Data tests verify that the data itself is valid, not just that the code runs without errors.

Integration tests verify that pipeline stages are compatible. The output of ingestion must have the schema expected by feature engineering. The output of feature engineering must have the columns expected by training. If one stage changes its output format, integration tests catch the mismatch before it reaches production.

## Pipeline Monitoring and Alerting

Once your pipeline is running in production, you need to monitor its health. A pipeline that silently produces corrupted data is worse than a pipeline that fails loudly. You need alerts for data quality issues, performance degradation, and infrastructure problems.

```python
class PipelineMonitor:
    def __init__(self):
        self.metrics = {}
        self.alerts = []
    
    def log_stage_metrics(self, stage: str, metrics: dict):
        self.metrics[stage] = {
            'timestamp': datetime.utcnow(),
            **metrics
        }
    
    def check_data_quality(self, df: pd.DataFrame, stage: str):
        checks = {
            'row_count': len(df) > 0,
            'null_rate': df.isnull().mean().max() < 0.5,
            'duplicate_rate': df.duplicated().mean() < 0.1,
            'schema_valid': all(
                col in df.columns 
                for col in ['amount', 'user_id', 'timestamp']
            ),
        }
        
        failed = [k for k, v in checks.items() if not v]
        
        if failed:
            self.alerts.append({
                'stage': stage,
                'timestamp': datetime.utcnow(),
                'type': 'data_quality',
                'failed_checks': failed,
                'severity': 'critical' if 'schema_valid' in failed else 'warning',
            })
        
        return checks
    
    def check_stage_performance(self, stage: str, duration_seconds: float, threshold: float = 3600):
        if duration_seconds > threshold:
            self.alerts.append({
                'stage': stage,
                'timestamp': datetime.utcnow(),
                'type': 'performance',
                'duration_seconds': duration_seconds,
                'threshold': threshold,
                'severity': 'warning',
            })
    
    def generate_report(self) -> dict:
        return {
            'total_alerts': len(self.alerts),
            'critical_alerts': sum(1 for a in self.alerts if a['severity'] == 'critical'),
            'metrics': self.metrics,
            'recent_alerts': self.alerts[-10:],
        }

monitor = PipelineMonitor()
```

The monitoring system runs alongside the pipeline and checks each stage's output. If the data quality drops below thresholds, it generates alerts. If a stage takes too long, it alerts on performance. The report aggregates all metrics and alerts into a single view that you can check daily.

## Assessment

### Lab Task 1: Build the Data Ingestion Pipeline (Time: 75 minutes)

Build a data ingestion pipeline that handles duplicates, schema changes, and validation.

**Steps:**
1. Create a `DataIngestion` class with methods for loading CSV and Parquet files.
2. Implement row hashing for deduplication.
3. Add schema change detection against a reference schema.
4. Implement data validation checks (no empty dataframes, required columns, value ranges).
5. Write ingested data to Parquet with timestamps.
6. Test with a dataset that includes duplicates and a schema change.

**Grading Criteria:**
- Correct deduplication using row hashing (15 points)
- Schema change detection catches added, removed, and type-changed columns (15 points)
- Validation checks are comprehensive and informative (15 points)
- Output is idempotent (re-running produces same result) (15 points)
- Code is modular and testable (10 points)
- Handles edge cases (empty files, corrupt data) (10 points)
- Includes logging with timestamps (10 points)

### Lab Task 2: Feature Engineering Pipeline (Time: 90 minutes)

Build a feature engineering pipeline that computes user and merchant features with multiple lookback windows.

**Steps:**
1. Compute user-level features: transaction counts, averages, and standard deviations for 7, 30, and 90-day windows.
2. Compute merchant-level features: average amounts, fraud rates, unique user counts.
3. Create interaction features: amount deviation from merchant average, user-merchant frequency.
4. Store features in Parquet format with metadata.
5. Handle missing values appropriately (not just dropping rows).

**Grading Criteria:**
- User features computed correctly for all three windows (20 points)
- Merchant features capture meaningful statistics (15 points)
- Interaction features add genuine signal (15 points)
- Missing values handled with documented strategy (15 points)
- Feature metadata is logged and retrievable (15 points)
- Pipeline runs end-to-end without errors (10 points)
- Performance is acceptable for datasets >100K rows (10 points)

### Lab Task 3: Orchestrate with Airflow (Time: 60 minutes)

Create an Airflow DAG that orchestrates the full pipeline.

**Steps:**
1. Define a DAG with the schedule, default args, and dependencies.
2. Create PythonOperator tasks for each pipeline stage.
3. Implement task dependencies using the `>>` operator.
4. Add error handling with retries and timeouts.
5. Configure email alerts for failures.

**Grading Criteria:**
- DAG structure is correct with proper dependencies (20 points)
- Tasks are idempotent and handle failures (20 points)
- Retry logic and timeouts are configured (15 points)
- Email alerts fire on failure (15 points)
- DAG can be serialized and parsed by Airflow (15 points)
- `max_active_runs` prevents overlapping executions (15 points)

## Evidence

- `data_ingestion.py` — Complete data ingestion module with deduplication, validation, and schema detection
- `feature_engineering.py` — Feature engineering pipeline with user, merchant, and interaction features
- `airflow_dag.py` — Airflow DAG definition with all tasks and dependencies
- `dvc_config.yaml` — DVC configuration for data versioning
- `pipeline_config.json` — Pipeline configuration with all parameters
- `test_pipeline.py` — Unit tests for each pipeline stage
- `mlflow_experiment.log` — Export of experiment tracking runs with parameters and metrics
