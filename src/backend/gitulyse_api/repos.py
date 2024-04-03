from time import time

from flask import Blueprint, jsonify, request
from github import Auth, Github, GithubException, BadCredentialsException

from .db import get_db

bp = Blueprint('repos', __name__)


@bp.route("/get-repos", methods=["GET"])
def get_repos():
    token = request.args.get("token")
    force = request.args.get("force")
    limit = request.args.get("limit")

    all_db_repos = get_db().repos

    try:
        auth = Auth.Token(token)
        g = Github(auth=auth)

        user = g.get_user()
        db_user_repos = all_db_repos[user.login]
    except BadCredentialsException:
        return jsonify({"message": "Invalid token"}), 401
    current_date_time = time()
    last_update_doc = db_user_repos.find_one({"name": "last_update"})

    repos = user.get_repos(sort="updated")
    if (
            user.login in all_db_repos.list_collection_names()
            and force != "true"
            and last_update_doc is not None
    ):
        last_updated = last_update_doc["timestamp"]
        time_diff = current_date_time - last_updated
        if time_diff > 21600:
            force = "true"

    repo_list = []
    if user.login not in all_db_repos.list_collection_names() or force == "true":
        db_user_repos.create_index("name", unique=True)
        for repo in repos:
            repo_info = {
                "name": repo.full_name,
            }

            try:
                repo_info["commit_count"] = repo.get_commits(author=user.login).totalCount
            except GithubException:
                repo_info["commit_count"] = 0

            repo_list.append(repo_info)

            if db_user_repos.find_one({"name": repo.full_name}) is None:
                db_user_repos.update_one(
                    {"name": repo.full_name}, {"$set": repo_info.copy()}, upsert=True
                )
        db_user_repos.update_one(
            {"name": "last_update"},
            {
                "$set": {
                    "timestamp": current_date_time,
                    "total_repos": len(repo_list.copy()),
                }
            },
            upsert=True,
        )
    else:
        repo_list = list(
            db_user_repos.find({"name": {"$ne": "last_update"}}, {"_id": 0})
        )
    if limit is not None:
        return jsonify({"repos": repo_list[: int(limit)]})
    else:
        return jsonify({"repos": repo_list})