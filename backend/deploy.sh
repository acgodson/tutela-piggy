#!/bin/bash

###############################################################################
# Tutela Pig Analysis - Automated Deployment Script
# 
# This script automates the deployment of the FastAPI backend to AWS EC2
# 
# Usage: ./deploy.sh
###############################################################################

set -e  # Exit on error

# Configuration
EC2_HOST="3.250.21.147"
EC2_USER="ubuntu"
KEY_FILE="uburu-key-pair.pem"
PROJECT_DIR="tutela-pig-analysis"
LOCAL_DIR="."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if key file exists
    if [ ! -f "$KEY_FILE" ]; then
        print_error "SSH key file '$KEY_FILE' not found!"
        echo "Please make sure $KEY_FILE is in the current directory"
        exit 1
    fi
    print_success "SSH key file found"
    
    # Check key permissions
    chmod 400 "$KEY_FILE"
    print_success "SSH key permissions set to 400"
    
    # Check if required files exist
    required_files=("main.py" "requirements.txt" "Dockerfile")
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Required file '$file' not found!"
            exit 1
        fi
    done
    print_success "All required files found"
    
    # Test SSH connection
    print_info "Testing SSH connection..."
    if ssh -i "$KEY_FILE" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "echo 'SSH connection successful'" > /dev/null 2>&1; then
        print_success "SSH connection test passed"
    else
        print_error "Cannot connect to EC2 instance"
        exit 1
    fi
}

# Setup EC2 environment
setup_ec2() {
    print_header "Setting Up EC2 Environment"
    
    ssh -i "$KEY_FILE" "$EC2_USER@$EC2_HOST" bash << 'ENDSSH'
        # Update system
        echo "Updating system packages..."
        sudo apt-get update -qq
        
        # Check if Docker is installed
        if ! command -v docker &> /dev/null; then
            echo "Installing Docker..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
            rm get-docker.sh
        fi
        
        # Check if Docker Compose is installed
        if ! command -v docker-compose &> /dev/null; then
            echo "Installing Docker Compose..."
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        fi
        
        # Create project directory
        mkdir -p ~/tutela-pig-analysis/{models,logs}
        
        echo "EC2 environment setup complete"
ENDSSH
    
    print_success "EC2 environment setup complete"
}

# Upload files to EC2
upload_files() {
    print_header "Uploading Files to EC2"
    
    print_info "Uploading application files..."
    rsync -avz -e "ssh -i $KEY_FILE" \
        --exclude='venv' \
        --exclude='__pycache__' \
        --exclude='.git' \
        --exclude='*.pyc' \
        --exclude='.DS_Store' \
        --exclude='node_modules' \
        "$LOCAL_DIR/" "$EC2_USER@$EC2_HOST:~/$PROJECT_DIR/"
    
    print_success "Files uploaded successfully"
}

# Build and deploy container
deploy_container() {
    print_header "Building and Deploying Container"
    
    ssh -i "$KEY_FILE" "$EC2_USER@$EC2_HOST" bash << ENDSSH
        cd ~/$PROJECT_DIR
        
        # Stop existing container if running
        echo "Stopping existing container..."
        docker stop tutela-api 2>/dev/null || true
        docker rm tutela-api 2>/dev/null || true
        
        # Build new image
        echo "Building Docker image..."
        docker build -t tutela-pig-api . || exit 1
        
        # Run container
        echo "Starting container..."
        docker run -d \
            --name tutela-api \
            -p 8002:8002 \
            -v \$(pwd)/models:/app/models \
            -v \$(pwd)/logs:/app/logs \
            --restart unless-stopped \
            tutela-pig-api
        
        # Wait for container to start
        echo "Waiting for container to start..."
        sleep 5
        
        # Check if container is running
        if docker ps | grep tutela-api > /dev/null; then
            echo "Container is running"
        else
            echo "Container failed to start"
            docker logs tutela-api
            exit 1
        fi
ENDSSH
    
    print_success "Container deployed successfully"
}

# Test deployment
test_deployment() {
    print_header "Testing Deployment"
    
    print_info "Waiting for API to be ready..."
    sleep 10
    
    # Test health endpoint
    print_info "Testing health endpoint..."
    if curl -s -f "http://$EC2_HOST:8002/health" > /dev/null; then
        print_success "Health check passed"
        
        # Display API response
        echo ""
        print_info "API Health Response:"
        curl -s "http://$EC2_HOST:8002/health" | python3 -m json.tool
        echo ""
    else
        print_error "Health check failed"
        print_info "Checking container logs..."
        ssh -i "$KEY_FILE" "$EC2_USER@$EC2_HOST" "docker logs --tail 50 tutela-api"
        exit 1
    fi
}

# Display deployment info
show_deployment_info() {
    print_header "Deployment Complete!"
    
    echo ""
    print_success "Your Tutela Pig Analysis API is now running!"
    echo ""
    echo "API Endpoints:"
    echo "  • Health Check:    http://$EC2_HOST:8002/health"
    echo "  • API Docs:        http://$EC2_HOST:8002/docs"
    echo "  • Image Detection: http://$EC2_HOST:8002/detect/image"
    echo "  • WebSocket:       ws://$EC2_HOST:8002/ws/detect"
    echo ""
    echo "Useful Commands:"
    echo "  • View logs:       ssh -i $KEY_FILE $EC2_USER@$EC2_HOST 'docker logs -f tutela-api'"
    echo "  • Restart:         ssh -i $KEY_FILE $EC2_USER@$EC2_HOST 'docker restart tutela-api'"
    echo "  • Stop:            ssh -i $KEY_FILE $EC2_USER@$EC2_HOST 'docker stop tutela-api'"
    echo "  • SSH into EC2:    ssh -i $KEY_FILE $EC2_USER@$EC2_HOST"
    echo ""
    print_info "Test the API with:"
    echo "  curl http://$EC2_HOST:8002/health"
    echo ""
}

# Main deployment flow
main() {
    echo ""
    print_header "Tutela Pig Analysis - Deployment Script"
    echo ""
    
    check_prerequisites
    echo ""
    
    setup_ec2
    echo ""
    
    upload_files
    echo ""
    
    deploy_container
    echo ""
    
    test_deployment
    echo ""
    
    show_deployment_info
}

# Run main function
main