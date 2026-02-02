pipeline {
  agent any

  parameters {
    choice(name: 'ENV', choices: ['dev', 'staging', 'prod'], description: 'Environment to update in GitOps on main builds')
    booleanParam(name: 'FORCE_ALL', defaultValue: false, description: 'Build all services regardless of diff')
    booleanParam(name: 'DRY_RUN', defaultValue: false, description: 'If true on main, do not push images or update GitOps')
  }

  environment {
    DOCKER_REGISTRY  = "docker.io"
    DOCKER_NAMESPACE = "bludivehub"

    IMG_IDENTITY      = "${DOCKER_REGISTRY}/${DOCKER_NAMESPACE}/clinicflow-identity"
    IMG_SCHEDULING    = "${DOCKER_REGISTRY}/${DOCKER_NAMESPACE}/clinicflow-scheduling"
    IMG_PROFILES      = "${DOCKER_REGISTRY}/${DOCKER_NAMESPACE}/clinicflow-profiles"
    IMG_NOTIFICATIONS = "${DOCKER_REGISTRY}/${DOCKER_NAMESPACE}/clinicflow-notifications"
    IMG_WEB           = "${DOCKER_REGISTRY}/${DOCKER_NAMESPACE}/clinicflow-web"

    // GitOps repo (edit to your real URL)
    // IMPORTANT: Use a plain https URL here (no bash tricks).
    GITOPS_REPO_URL = "https://github.com/Bludive-Devops-Platform/clinicflow-gitops.git"
    GITOPS_BRANCH   = "main"
  }

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  stages {
    stage("Checkout") {
      steps {
        checkout scm
        sh 'git rev-parse --short=7 HEAD > .gitsha'
        script {
          env.GIT_SHA = readFile('.gitsha').trim()
          env.IMAGE_TAG = "sha-${env.GIT_SHA}"
        }
        echo "IMAGE_TAG=${env.IMAGE_TAG}"
      }
    }

    stage("Detect Build Mode (PR vs Main)") {
      steps {
        script {
          env.IS_PR = (env.CHANGE_ID ? "true" : "false")
          echo "IS_PR=${env.IS_PR}"
          if (env.IS_PR == "true") {
            echo "PR Build detected: will NOT push images and will NOT update GitOps."
          } else {
            echo "Main branch build detected: can push images + update GitOps (unless DRY_RUN=true)."
          }
        }
      }
    }

    stage("Detect Changed Services") {
      steps {
        script {
          def changedFiles = ""
          def targets = []

          sh "git fetch --all --prune"

          try {
            if (params.FORCE_ALL) {
              targets = ["identity","scheduling","profiles","notifications","web"]
              changedFiles = "(FORCE_ALL enabled)"
            } else if (env.IS_PR == "true") {
              def targetBranch = env.CHANGE_TARGET ? env.CHANGE_TARGET : "main"
              changedFiles = sh(
                script: "git diff --name-only origin/${targetBranch}...HEAD",
                returnStdout: true
              ).trim()
            } else {
              changedFiles = sh(
                script: "git diff --name-only HEAD~1..HEAD",
                returnStdout: true
              ).trim()
            }
          } catch (e) {
            echo "Diff detection failed; falling back to build ALL services. Reason: ${e}"
            targets = ["identity","scheduling","profiles","notifications","web"]
          }

          if (!params.FORCE_ALL && targets.isEmpty()) {
            if (changedFiles?.trim()) {
              if (changedFiles.contains("services/identity/"))      targets << "identity"
              if (changedFiles.contains("services/scheduling/"))    targets << "scheduling"
              if (changedFiles.contains("services/profiles/"))      targets << "profiles"
              if (changedFiles.contains("services/notifications/")) targets << "notifications"
              if (changedFiles.contains("apps/web/"))               targets << "web"
            }
          }

          targets = targets.unique()
          env.TARGETS = targets.join(",")

          echo "Changed files:\n${changedFiles}"
          echo "Targets: ${env.TARGETS}"

          if (targets.size() == 0) {
            echo "No service folder changes detected. Pipeline will skip build/push/deploy."
          }
        }
      }
    }

    stage("Docker Login (main only)") {
      when { expression { return env.IS_PR == "false" && !params.DRY_RUN && env.TARGETS?.trim() } }
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
          sh 'echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin'
        }
      }
    }

    stage("Build Selected Images") {
      when { expression { return env.TARGETS?.trim() } }
      steps {
        script {
          def targets = env.TARGETS.tokenize(',')

          for (t in targets) {
            if (t == "identity") {
              sh "docker build -t ${IMG_IDENTITY}:${IMAGE_TAG} ./services/identity"
            }
            if (t == "scheduling") {
              sh "docker build -t ${IMG_SCHEDULING}:${IMAGE_TAG} ./services/scheduling"
            }
            if (t == "profiles") {
              sh "docker build -t ${IMG_PROFILES}:${IMAGE_TAG} ./services/profiles"
            }
            if (t == "notifications") {
              sh "docker build -t ${IMG_NOTIFICATIONS}:${IMAGE_TAG} ./services/notifications"
            }
            if (t == "web") {
              sh "docker build -t ${IMG_WEB}:${IMAGE_TAG} ./apps/web"
            }
          }
        }
      }
    }

    stage("Push Selected Images (main only)") {
      when { expression { return env.IS_PR == "false" && !params.DRY_RUN && env.TARGETS?.trim() } }
      steps {
        script {
          def targets = env.TARGETS.tokenize(',')

          for (t in targets) {
            if (t == "identity")      sh "docker push ${IMG_IDENTITY}:${IMAGE_TAG}"
            if (t == "scheduling")    sh "docker push ${IMG_SCHEDULING}:${IMAGE_TAG}"
            if (t == "profiles")      sh "docker push ${IMG_PROFILES}:${IMAGE_TAG}"
            if (t == "notifications") sh "docker push ${IMG_NOTIFICATIONS}:${IMAGE_TAG}"
            if (t == "web")           sh "docker push ${IMG_WEB}:${IMAGE_TAG}"
          }
        }
      }
    }

    stage("Approval Gate (staging/prod only)") {
      when {
        expression {
          return env.IS_PR == "false" &&
                 !params.DRY_RUN &&
                 env.TARGETS?.trim() &&
                 (params.ENV == "staging" || params.ENV == "prod")
        }
      }
      steps {
        script {
          def msg = "Approve deployment to ${params.ENV} for tag ${env.IMAGE_TAG} (services: ${env.TARGETS})?"
          timeout(time: 30, unit: 'MINUTES') {
            input message: msg, ok: "Approve"
          }
        }
      }
    }

    stage("Update GitOps Values (main only)") {
      when { expression { return env.IS_PR == "false" && !params.DRY_RUN && env.TARGETS?.trim() } }
      steps {
        withCredentials([usernamePassword(credentialsId: 'gitops-token', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
          script {
            // Build an authenticated clone URL safely in Groovy
            def authedRepo = env.GITOPS_REPO_URL.replace("https://", "https://${GIT_USER}:${GIT_TOKEN}@")
            env.GITOPS_AUTHED_URL = authedRepo
          }

          sh """
            set -e

            rm -rf /tmp/clinicflow-gitops
            git clone -b ${GITOPS_BRANCH} "${GITOPS_AUTHED_URL}" /tmp/clinicflow-gitops
            cd /tmp/clinicflow-gitops

            VALUES_FILE="environments/${ENV}/values.yaml"
            test -f "$VALUES_FILE"

            TARGETS="${TARGETS}"
            IMAGE_TAG="${IMAGE_TAG}"

            python3 - << 'PY'
import os, yaml

values_file = os.environ["VALUES_FILE"]
targets = [t.strip() for t in os.environ["TARGETS"].split(",") if t.strip()]
image_tag = os.environ["IMAGE_TAG"]

with open(values_file, "r") as f:
    data = yaml.safe_load(f) or {}

data.setdefault("images", {})
for svc in targets:
    data["images"].setdefault(svc, {})
    data["images"][svc]["tag"] = image_tag

with open(values_file, "w") as f:
    yaml.safe_dump(data, f, sort_keys=False)

print(f"Updated {values_file} services={targets} -> tag={image_tag}")
PY

            git status
            git config user.email "jenkins@bludive.local"
            git config user.name "Jenkins CI"

            git add "$VALUES_FILE"
            git commit -m "Deploy ${ENV}: ${IMAGE_TAG} (services: ${TARGETS})" || echo "No changes to commit"
            git push origin ${GITOPS_BRANCH}
          """
        }
      }
    }
  }

  post {
    always {
      sh 'docker logout || true'
    }
    success {
      script {
        if (env.TARGETS?.trim()) {
          if (env.IS_PR == "true") {
            echo "✅ PR build complete: Built ${env.TARGETS} tag=${env.IMAGE_TAG}. (No push/deploy)"
          } else if (params.DRY_RUN) {
            echo "✅ Main build DRY_RUN complete: Built ${env.TARGETS} tag=${env.IMAGE_TAG}. (No push/deploy)"
          } else {
            echo "✅ Main build complete: Built+pushed ${env.TARGETS} tag=${env.IMAGE_TAG}. GitOps updated for ENV=${params.ENV}."
          }
        } else {
          echo "✅ No service changes detected. Nothing built/pushed/deployed."
        }
      }
    }
  }
}
