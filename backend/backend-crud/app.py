from flask import Flask, jsonify
from flask_cors import CORS
from routes.appointments import appointments_bp
from config import initialize_firebase
import os

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Initialize Firebase
initialize_firebase()

# Register blueprints
app.register_blueprint(appointments_bp)

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify API is running"""
    return jsonify({
        'status': 'healthy',
        'message': 'Medical Scribe CRUD API is running'
    }), 200

# Root endpoint
@app.route('/', methods=['GET'])
def root():
    """Root endpoint with API information"""
    return jsonify({
        'name': 'Medical Scribe CRUD API',
        'version': '1.0.0',
        'endpoints': {
            'POST /appointments': 'Create a new appointment',
            'GET /appointments': 'Get all appointments for a user',
            'GET /appointments/{id}': 'Get appointment details'
        }
    }), 200

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 8080))
    
    # Run the application
    app.run(
        host='0.0.0.0',
        port=port,
        debug=os.environ.get('FLASK_ENV') == 'development'
    )
