from flask import Flask, request, jsonify, render_template
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import os

app = Flask(__name__)

# Load dataset into memory
data_path = os.path.join(os.path.dirname(__file__), 'dataset.csv')
df = pd.read_csv(data_path)

def get_recommendations(target_user_id):
    # Step 1: Create user-item matrix
    user_item_matrix = df.pivot_table(index='user_id', columns='product_id', values='rating')
    
    # Fill missing values with 0
    user_item_matrix = user_item_matrix.fillna(0)
    
    if target_user_id not in user_item_matrix.index:
        return [] # User not found
    
    # Step 2: Calculate cosine similarity between users
    similarity_matrix = cosine_similarity(user_item_matrix)
    similarity_df = pd.DataFrame(similarity_matrix, index=user_item_matrix.index, columns=user_item_matrix.index)
    
    # Step 3: Find similar users for target user
    similar_users = similarity_df[target_user_id].sort_values(ascending=False)
    
    # Exclude the target user themselves
    similar_users = similar_users[similar_users.index != target_user_id]
    
    # Get products already rated by the target user
    target_user_ratings = user_item_matrix.loc[target_user_id]
    seen_products = target_user_ratings[target_user_ratings > 0].index.tolist()
    
    candidates = {}
    
    # Iterate over similar users
    for similar_user, sim_score in similar_users.items():
        if sim_score <= 0:
            continue
            
        # Get products rated by similar user
        sim_user_ratings = user_item_matrix.loc[similar_user]
        
        # Consider products that they rated highly (rating >= 4)
        highly_rated_by_sim_user = sim_user_ratings[sim_user_ratings >= 4].index.tolist()
        
        for item in highly_rated_by_sim_user:
            # If the target user hasn't seen this product
            if item not in seen_products:
                weighted_score = sim_score * sim_user_ratings[item]
                if item not in candidates:
                    candidates[item] = weighted_score
                else:
                    candidates[item] += weighted_score
                    
    # Sort candidate products by the highest weighted score
    sorted_candidates = sorted(candidates.items(), key=lambda x: x[1], reverse=True)
    
    # Get top 5 recommendation product IDs
    top_5_ids = [item[0] for item in sorted_candidates[:5]]
    
    # Fetch detailed data for recommended products
    recommended_products = []
    for p_id in top_5_ids:
        # Get the first occurrence of product details from dataset
        product_info = df[df['product_id'] == p_id].iloc[0]
        # Calculate realistic average rating to display
        avg_rating = df[df['product_id'] == p_id]['rating'].mean()
        
        recommended_products.append({
            'product_id': p_id,
            'product_name': product_info['product_name'],
            'category': product_info['category'],
            'rating': round(avg_rating, 1)
        })
        
    return recommended_products

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/recommend', methods=['GET'])
def recommend():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'No user_id provided'}), 400
    
    # Normalize input case like u1 to U1 if needed
    user_id = user_id.upper()
    
    try:
        recommendations = get_recommendations(user_id)
        if not recommendations:
             return jsonify({'message': 'User not found or no recommendations available.', 'recommendations': []}), 200
             
        return jsonify({'recommendations': recommendations}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == '__main__':
    app.run(debug=True, port=5000)
