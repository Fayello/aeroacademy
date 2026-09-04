-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "source" TEXT NOT NULL,
    "ruleId" TEXT,
    "message" TEXT NOT NULL,
    "uri" TEXT,
    "method" TEXT,
    "status" INTEGER,
    "data" TEXT,
    "banned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecurityEvent_timestamp_idx" ON "SecurityEvent"("timestamp");

-- CreateIndex
CREATE INDEX "SecurityEvent_ip_idx" ON "SecurityEvent"("ip");

-- CreateIndex
CREATE INDEX "SecurityEvent_type_idx" ON "SecurityEvent"("type");

-- CreateIndex
CREATE INDEX "SecurityEvent_severity_idx" ON "SecurityEvent"("severity");

-- CreateIndex
CREATE INDEX "SecurityEvent_source_idx" ON "SecurityEvent"("source");

-- CreateIndex
CREATE INDEX "SecurityEvent_banned_idx" ON "SecurityEvent"("banned");

-- CreateIndex
CREATE INDEX "SecurityEvent_timestamp_type_idx" ON "SecurityEvent"("timestamp", "type");

-- CreateIndex
CREATE INDEX "SecurityEvent_ip_timestamp_idx" ON "SecurityEvent"("ip", "timestamp");
