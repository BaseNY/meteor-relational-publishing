Package.describe({
	summary: "A meteor package for relational publishing.",
	version: "0.1.0",
	git: "https://github.com/BaseNY/meteor-relational-publishing.git"
});

Package.onUse(function(api) {
	api.versionsFrom('METEOR@0.9.0');

	api.addFiles('hashset.js', 'server');

	api.use([
		'stevezhu:lodash@0.1.0',
		//'ejson',
		'mongo'
	]);
	//api.addFiles('relational_publish.js', 'server');

	api.use('dburles:collection-helpers@1.0.0');
	api.addFiles('publish6.js', ['client', 'server']);
});

Package.onTest(function(api) {
	api.use('meteorhacks:kadira');
	api.use([
		'underscore',
		'mongo',
		'tinytest',
		'test-helpers'
	]);
	api.use('base:relational-publish');
	//api.addFiles('tests/publish_test.js');
	api.addFiles('tests/publish6_test.js');
});
