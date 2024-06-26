from flask import Blueprint, request, jsonify
from github import Auth, Github, BadCredentialsException
from github.StatsContributor import StatsContributor

bp = Blueprint('commits', __name__)


def parse_contributions(contributor: StatsContributor, contributions, single_user=False):
    author = contributor.author
    weeks: list[StatsContributor.Week] = contributor.weeks
    for week in weeks:
        month = week.w.date().strftime("%Y-%m")
        if not single_user:
            if author.login not in contributions[month]:
                contributions[month][author.login] = {
                    "additions": week.a,
                    "deletions": week.d,
                    "commits": week.c,
                }
            else:
                contributions[month][author.login]["additions"] += week.a
                contributions[month][author.login]["deletions"] += week.d
                contributions[month][author.login]["commits"] += week.c
        else:
            contributions[month]["additions"] += week.a
            contributions[month]["deletions"] += week.d
            contributions[month]["commits"] += week.c

    return contributions


def get_contributions_from_repo(token, owner, repo_name):
    auth = Auth.Token(token)
    gh = Github(auth=auth)

    repo_full_name = f"{owner}/{repo_name}"

    repo = gh.get_repo(repo_full_name)

    contributors = repo.get_stats_contributors()
    contributions = {}
    for week in contributors[0].weeks:
        contributions[week.w.date().strftime("%Y-%m")] = {}

    for contributor in contributors:
        contributions = parse_contributions(contributor, contributions)

    return contributions


@bp.route("/code-contribution-stats", methods=["GET"])
def code_contribution_stats():
    token = request.args.get("token")
    owner = request.args.get("owner")
    repo_name = request.args.get("repo")

    if owner is None or owner == "":
        return jsonify({"message": "No owner provided"}), 400
    else:
        owner = owner.lower()

    if repo_name is None or repo_name == "":
        return jsonify({"message": "No repo provided"}), 400
    else:
        repo_name = repo_name.lower()

    try:
        contributions = get_contributions_from_repo(token, owner, repo_name)
    except BadCredentialsException:
        return jsonify({"message": "Invalid token"}), 401

    for month in contributions:
        for author in contributions[month]:
            if contributions[month][author]["commits"] == 0:
                average_contributions_per_commit = 0
            else:
                average_contributions_per_commit = round(contributions[month][author]["additions"] +
                                                         contributions[month][author]["deletions"] /
                                                         contributions[month][author]["commits"], 1)
            contributions[month][author] = average_contributions_per_commit

    return jsonify({"monthly": contributions}), 200
