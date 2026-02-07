#!/bin/bash

echo "🐳 Starting METIS Docker Deployment"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "📝 Please copy .env.example to .env and fill in your credentials:"
    echo "   cp .env.example .env"
    echo ""
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Build and start containers
echo "🔨 Building Docker images..."
docker-compose build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
    echo ""
    echo "🚀 Starting services..."
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ METIS is now running!"
        echo ""
        echo "📊 Service URLs:"
        echo "   Frontend: http://localhost:3000"
        echo "   Backend:  http://localhost:5000"
        echo ""
        echo "📝 View logs:"
        echo "   docker-compose logs -f"
        echo ""
        echo "🛑 Stop services:"
        echo "   docker-compose down"
        echo ""
    else
        echo "❌ Failed to start services"
        exit 1
    fi
else
    echo "❌ Build failed"
    exit 1
fi
