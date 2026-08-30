# Module 1 — IaC Fundamentals

## What You'll Actually Do

You'll write infrastructure by hand in a cloud console, then redo the same thing with code. You'll feel the difference immediately. One takes twenty clicks and a prayer. The other takes a file you can review, version, and share.

By the end of this module you'll understand why engineers stopped clicking buttons in dashboards and started writing configuration files instead.

## Why Infrastructure as Code

Manual infrastructure breaks down the moment you need to do something twice. Deploy a staging environment that mirrors production? Click through the same forty screens again and hope you didn't miss a subnet. Need to tear it all down and start fresh? Good luck remembering which resources you created last Tuesday.

IaC solves this by treating infrastructure as something you define in text files, commit to version control, and apply with a single command. You get reproducibility, auditability, and the ability to review infrastructure changes the same way you review code changes.

The core benefits:

- **Repeatable**: Same file, same result, every time. No "works on my machine" for infrastructure.
- **Versionable**: `git log` shows who changed what and when. Rollback is just reverting a commit.
- **Reviewable**: Pull requests for infrastructure changes mean someone else eyes the work before it hits production.
- **Documentable**: The code IS the documentation. No separate wiki page that's six months out of date.

## Declarative vs Imperative

This is the most important distinction in IaC, and it affects every tool you'll use.

**Declarative** means you describe the desired end state. You say "I want three web servers behind a load balancer" and the tool figures out how to get there. Terraform, CloudFormation, and Pulumi (in its default mode) work this way.

```hcl
# Declarative — you say WHAT you want
resource "aws_instance" "web" {
  count         = 3
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  tags = {
    Name = "web-${count.index + 1}"
  }
}
```

**Imperative** means you describe the steps to get there. You write the sequence of actions: create this, then attach that, then configure this other thing. Ansible and shell scripts work this way.

```yaml
# Imperative — you say HOW to do it
- name: Create web servers
  amazon.aws.ec2_instance:
    name: "web-{{ item }}"
    instance_type: t3.micro
    image_id: ami-0c55b159cbfafe1f0
    state: present
  loop: [1, 2, 3]

- name: Attach to load balancer
  community.aws.elb_instance:
    instance_id: "{{ web_instances.results | map(attribute='instance_ids') | flatten }}"
    load_balancers: web-lb
    state: present
```

Neither is strictly better. Declarative tools are great for infrastructure where you care about the end state. Imperative tools shine when the order of operations matters or when you need conditional logic that goes beyond "make it match this file."

Most real-world setups use both. You declare your infrastructure with Terraform and configure it with Ansible.

## The State Problem

Every IaC tool needs to track what it created. This is called **state**. When you run `terraform apply`, Terraform looks at its state file, compares it to your configuration, and makes only the changes needed to reconcile the two.

This is powerful but introduces a coordination problem. If two people apply changes at the same time, one of them might overwrite the other's work. State management becomes a real concern as soon as you're working on a team.

We'll cover state management in depth in later modules. For now, know that state exists and it matters.

## Idempotency

Run the same IaC script once, you get the desired result. Run it again, nothing changes. Run it a hundred times, still the same result. This property is called **idempotency**, and it's non-negotiable for production infrastructure.

```bash
# First run: creates the resource
terraform apply

# Second run: "No changes. Your infrastructure matches the configuration."
terraform apply
```

Without idempotency, every run would create duplicate resources and you'd be in a mess by lunch.

## The IaC Workflow

The standard loop looks like this:

1. Write or modify configuration files
2. Run a plan or preview to see what will change
3. Review the changes
4. Apply the changes
5. Commit the updated files to version control

```bash
# Write your .tf files
vim main.tf

# See what Terraform wants to do
terraform plan

# Make the changes
terraform apply

# Commit the infrastructure
git add *.tf
git commit -m "Add three web servers"
```

## Assessment

**Lab Task**: Set up a local development environment. Install Terraform and Ansible. Write a simple Terraform configuration that provisions a local directory structure (using the `local_file` resource) representing a three-tier app layout — `web/`, `api/`, `db/`. Each directory should contain a `README.md` describing its purpose. Apply it, verify the directories exist, then modify one file and re-apply to see the plan output.

**Time**: 25 minutes

**Grading**:
- Terraform installs and runs `terraform init` successfully (20 points)
- Configuration creates three directories with correct README files (30 points)
- `terraform plan` shows no changes after initial apply (20 points)
- Modification triggers a correct plan showing only the changed file (30 points)

## Evidence

- Screenshot of `terraform plan` output showing "No changes" after first apply
- Screenshot of modified `terraform plan` showing the single file change
- The `main.tf` file committed to your repository
