# KNN
import sys, json
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import OneHotEncoder

def build_text(post):
    return f"{post['title']} {post['description']} {post['city']} {post['country']}"

def main():
    data = json.load(sys.stdin)
    all_posts = data['allPosts']
    favorites = data['favoritePosts']
    print("Favorite posts:", len(favorites), file=sys.stderr)

    if not favorites:
        print(json.dumps(all_posts[:6]))
        return

    posts_df = pd.DataFrame(all_posts)
    posts_df['text'] = posts_df.apply(build_text, axis=1)

    fav_ids = set(fav['id'] for fav in favorites)
    fav_df = posts_df[posts_df['id'].isin(fav_ids)].copy()
    cand_df = posts_df[~posts_df['id'].isin(fav_ids)].copy()

    if fav_df.empty or cand_df.empty:
        print(json.dumps(all_posts[:6]))
        return

    # TF-IDF text features
    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(posts_df['text'])

    fav_vec = tfidf_matrix[posts_df['id'].isin(fav_ids)].mean(axis=0)
    cand_vecs = tfidf_matrix[posts_df['id'].isin(fav_ids) == False]

    # OneHot location
    ohe = OneHotEncoder()
    loc_matrix = ohe.fit_transform(posts_df[['city', 'country']].fillna(''))

    fav_loc = loc_matrix[posts_df['id'].isin(fav_ids)].mean(axis=0)
    cand_loc = loc_matrix[posts_df['id'].isin(fav_ids) == False]

    # Combine TF-IDF + loc
    fav_combined = np.hstack([fav_vec.A, fav_loc.A])
    cand_combined = np.hstack([cand_vecs.toarray(), cand_loc.toarray()])

    # KNN
    knn = NearestNeighbors(n_neighbors=6, metric='cosine')
    knn.fit(cand_combined)
    distances, indices = knn.kneighbors(fav_combined)

    recommended = cand_df.iloc[indices[0]].to_dict(orient='records')
    print(json.dumps(recommended))

if __name__ == "__main__":
    main()