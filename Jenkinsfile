pipeline {
    agent {
        label 'unibite'
    }
    stages {
        stage('info') {
            steps {
                sh(script: """ whoami;pwd;ls -la """, label: "first stage")
            }
        }
    }
}