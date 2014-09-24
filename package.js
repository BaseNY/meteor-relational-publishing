Package.describe({
	summary: "A meteor package for relational publishing.",
	version: "0.1.0",
	git: "https://github.com/BaseNY/meteor-relation-publish.git"
});

Package.onUse(function(api) {
	api.versionsFrom('METEOR@0.9.0');

	api.addFiles('hashset.js', 'server');

	api.use([
		'underscore',
		//'ejson',
		'mongo'
	]);
	api.addFiles('relational_publish.js', 'server');
});

Package.onTest(function(api) {
	api.use([
		'underscore',
		'mongo',
		'tinytest',
		'test-helpers'
	]);
	api.use('base:relational-publishing');
	api.addFiles('tests/publish_test.js');
});
