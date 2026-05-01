pipeline {
    agent {
        label 'unibite'
    }
    environment {
        APP_NAME = 'unibite'
        DOCKER_HUB = 'luchanvu'
        NAME_BACKEND = "${APP_NAME}-backend"
        BACKEND_PORT = 8080
        HUB_CRED_ID = 'docker-hub-credentials'
        DOCKER_TAG = "v0.0.1"
        IMAGE_NAME = "${DOCKER_HUB}/${NAME_BACKEND}:${DOCKER_TAG}"
        ENV_ID = 'unibite-env-file'
        BE_PATH = "Unibite/be"
    }
    stages {
        stage('Stop & Remove Old Container') {
            steps {
                echo 'Stopping and removing old container if exists...'

                script {
                    echo "Checking for container: ${NAME_BACKEND}"
                    def containerId = sh(script: "docker ps -aq --filter name=^${NAME_BACKEND}\$", returnStdout: true).trim()
                    
                    if (containerId) {
                        echo "Stopping and removing container ID: ${containerId}"
                        sh "docker rm -f ${NAME_BACKEND} || true" 
                    } else {
                        echo "No existing container found."
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                sh "docker build -t ${IMAGE_NAME} -f ${BE_PATH}/Dockerfile ${BE_PATH}"
            }
        }

        stage('Push to Registry') {
            steps {
                echo 'Pushing Docker image to registry...'
                withCredentials([usernamePassword(credentialsId: HUB_CRED_ID, passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                    sh 'echo  $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    sh "docker push ${IMAGE_NAME}"
                    sh "docker logout"
                }
            }
        }

        stage('Run Container') {
            steps {
                echo 'Running new container...'

                withCredentials([file(credentialsId: ENV_ID, variable: 'ENV_FILE')]) {
                    sh "docker run --env-file ${ENV_FILE} --name ${NAME_BACKEND} -dp ${BACKEND_PORT}:${BACKEND_PORT} ${IMAGE_NAME}"
                }

                echo 'Waiting for container to start...'
                sleep(time: 5, unit: 'SECONDS')

                script {
                    def containerStatus = sh(
                        script: "docker ps --filter name=${CONTAINER_NAME} --format '{{.Status}}'", returnStdout: true
                    ).trim()

                    echo "Container status: ${containerStatus}"
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up dangling images...'
            sh "docker image prune -f || true"
        }

        success {
            echo "Deployment successful!"
        }

        failure {
            echo "Deployment failed. Please check the logs."
        }
    }
}