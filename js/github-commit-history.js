(function($) {
	$.fn.GithubCommitHistory = function(options) {
		var defaults = {
			username: "halfdan",
			repo: "github-commit-history",
			branch: "master",
			limit: 50,
			offset: 0,
			gravatar_size: 50
		};

		var options = $.extend(defaults, options);

		return this.each(function() {

			var obj = $(this);

			var template;
			$.get('_commit.html', function(data) {
				template = data;
			});
//
			//jQuery.getJSON("http://github.com/api/v2/json/commits/list/" + options["username"] + "/" + options["repo"] + "/" + options["branch"] + "?callback=?", function(data) {
			console.log("https://api.github.com/repos/" + options["username"] + "/" + options["repo"] + "/commits");
jQuery.getJSON("https://api.github.com/repos/" + options["username"] + "/" + options["repo"] + "/commits", function(data) {
				$.each(data, function(idx, commit) {
					
					// Don't show the first "offset" entries.
					if(idx < options["offset"]) {
						return true;
					}
					
					// Break out of .each of we've reached our limit.
					if(idx == options["limit"] + options["offset"]) {
						return false;
					}

					commit = $.extend(commit, options);
					commit.message = commit.commit.message;
					commit.id = commit.sha;
					commit.name = commit.commit.author.name;
					var d = new Date(commit.commit.author.date);
					commit.authored_date = d.toUTCString();
					// Generate gravatar ID
					commit.author.gravatar_id = $.md5(commit.commit.author.email.toLowerCase());

					var html = Mustache.to_html(template, commit);
					obj.append(html);
				});
			});

		});
	};

})(jQuery);
