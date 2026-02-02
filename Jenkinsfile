pipeline {
  agent any
  options { timestamps() }

  environment {
    // Your GitOps repo over HTTPS
    GITOPS_REPO = 'https://github.com/Bludive-Devops-Platform/clinicflow-gitops.git'
    GITOPS_BRANCH = 'main'

    // Used as image tag
    TAG = "sha-${env.GIT_COMMIT.take(7)}"

    // Git identity for commits to GitOps repo
    GIT_AUTHOR_NAME  = 'jenkins'
    GIT_AUTHOR_EMAIL = 'jenkins@local'
  }

  stages {
    stage('Detect changes') {
      steps {
        script {
          sh "git fetch origin +refs/heads/*:refs/remotes/origin/* --prune"

          def from = env.GIT_PREVIOUS_SUCCESSFUL_COMMIT
          def to = env.GIT_COMMIT

          def range = ""
          if (from?.trim()) {
            range = "${from}..${to}"
          } else {
            // first run fallback
            range = "origin/main..HEAD"
          }

          echo "Diff range: ${range}"

          def changedFiles = sh(
            script: "git diff --name-only ${range}",
            returnStdout: true
          ).trim()

          if (!changedFiles) {
            echo "No file changes detected."
            env.CHANGED = ""
            currentBuild.description = "No changes"
            return
          }

          def changed = [] as Set
          changedFiles.split('\n').each { f ->
            if (f.startsWith('services/identity/')) changed << 'identity'
            if (f.startsWith('services/scheduling/')) changed << 'scheduling'
            if (f.startsWith('services/profiles/')) changed << 'profiles'
            if (f.startsWith('services/notifications/')) changed << 'notifications'
            if (f.startsWith('apps/web/')) changed << 'web'
          }

          if (changed.isEmpty()) {
            env.CHANGED = ""
            currentBuild.description = "No service changes"
            echo "No relevant service changes."
            return
          }

          env.CHANGED = changed.join(',')
          currentBuild.description = "Changed: ${env.CHANGED} | ${env.TAG}"
          echo "Services changed: ${env.CHANGED}"
        }
      }
    }

    stage('Build & push (only changed)') {
      when { expression { return env.CHANGED?.trim() } }
      steps {
        script {
          def services = env.CHANGED.split(',') as List

          // Must match your Jenkins multibranch job names
          def jobMap = [
            identity      : 'clinicflow-identity',
            scheduling    : 'clinicflow-scheduling',
            profiles      : 'clinicflow-profiles',
            notifications : 'clinicflow-notifications',
            web           : 'clinicflow-web'
          ]

          def builds = [:]
          services.each { svc ->
            builds[svc] = {
              build job: jobMap[svc],
                parameters: [
                  string(name: 'IMAGE_TAG', value: env.TAG)
                ],
                wait: true
            }
          }
          parallel builds
        }
      }
    }

    stage('Update GitOps DEV') {
      when { expression { return env.CHANGED?.trim() } }
      steps {
        script {
          updateGitOps('dev', env.CHANGED.split(',') as List, env.TAG)
        }
      }
    }

    stage('Approve → STAGING') {
      when { expression { return env.CHANGED?.trim() } }
      steps {
        script {
          input message: "Promote ${env.CHANGED} to STAGING with ${env.TAG}?"
          updateGitOps('staging', env.CHANGED.split(',') as List, env.TAG)
        }
      }
    }

    stage('Approve → PROD') {
      when { expression { return env.CHANGED?.trim() } }
      steps {
        script {
          input message: "Promote ${env.CHANGED} to PROD with ${env.TAG}?"
          updateGitOps('prod', env.CHANGED.split(',') as List, env.TAG)
        }
      }
    }
  }
}

def updateGitOps(envName, services, tag) {
  dir("gitops") {
    deleteDir()

    // If your GitOps repo is private over HTTPS, use credentials
    withCredentials([usernamePassword(credentialsId: 'gitops-https-creds', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {

      sh """
        git config --global user.name "${GIT_AUTHOR_NAME}"
        git config --global user.email "${GIT_AUTHOR_EMAIL}"
      """

      // Embed creds for clone/push (works for CI)
      def authedRepo = GITOPS_REPO.replace("https://", "https://${GIT_USER}:${GIT_PASS}@")

      sh """
        git clone -b ${GITOPS_BRANCH} ${authedRepo} .
      """

      def valuesFile = "environments/${envName}/values.yaml"

      // Update only changed services’ image tags
      services.each { svc ->
        sh """yq -i '.images.${svc}.tag = "${tag}"' ${valuesFile}"""
      }

      sh """
        git add ${valuesFile}
        git commit -m "deploy(${envName}): ${services.join(',')} -> ${tag}" || true
        git push origin ${GITOPS_BRANCH}
      """
    }
  }
}
