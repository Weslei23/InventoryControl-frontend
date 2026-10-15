pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        // URL da API (backend) usada no build do Vite
        VITE_API_URL = 'http://192.168.3.183:8081'
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Install') {
            steps {
                // Requer Node.js 18+ disponível no agente Jenkins
                sh 'npm ci'
            }
        }
        stage('Build') {
            steps { sh 'npm run build' }
            post {
                success { archiveArtifacts artifacts: 'dist/**', fingerprint: true }
            }
        }
    }
}
