var A = new Meteor.Collection('a');
var B = new Meteor.Collection('b');

if (Meteor.isServer) {
	Tinytest.add("Relational Publishing - Working", function(test) {
		A.insert({score: 1, name: 'abc'});
		B.insert({score: 1, name: 'def'});
	});
}

if (Meteor.isClient) {
	Tinytest.addAsync("Relational Publishing - Find", function(test, next) {
		next();
	});
}