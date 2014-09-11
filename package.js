Package.describe({
	summary: "A meteor package for relational publishing.",
	version: "0.1.0",
	git: "https://github.com/BaseNY/meteor-relation-publish.git"
});

Package.onUse(function(api) {
	api.versionsFrom('METEOR@0.9.0');
});

Package.onTest(function(api) {
	api.use('tinytest');
	api.use('base:relational-publishing');
});
