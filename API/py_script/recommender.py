import sys
import json
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.feature_extraction.text import HashingVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def build_text(post):
    return f"{post['title']} {post['description']} {post['city']} {post['country']}"

def generate_personalized_feed():
    data = json.load(sys.stdin)
    all_posts = data['allPosts']
    favorites = data['favoritePosts']
    print("Favorite posts:", len(favorites), file=sys.stderr)
    
    if not favorites:
        print(json.dumps(all_posts[:20]))  
        return

    fav_ids = set(fav['id'] for fav in favorites)
    fav_posts = [p for p in all_posts if p['id'] in fav_ids]
    candidate_posts = [p for p in all_posts if p['id'] not in fav_ids]

    corpus = [build_text(p) for p in fav_posts + candidate_posts]
    vectorizer = HashingVectorizer(stop_words='english', n_features=2**12)
    tfidf = vectorizer.transform(corpus)

    fav_vec = np.mean(tfidf[:len(fav_posts)].toarray(), axis=0).reshape(1, -1)
    cand_vecs = tfidf[len(fav_posts):].toarray()

    sims = cosine_similarity(fav_vec, cand_vecs)[0]
    top_indices = sims.argsort()[-20:][::-1]

    top_posts = [candidate_posts[i] for i in top_indices]
    print(json.dumps(top_posts))

if __name__ == '__main__':
    generate_personalized_feed()



