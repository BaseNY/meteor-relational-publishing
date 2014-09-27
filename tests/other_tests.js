// even with 

A = new Mongo.Collection('a');
var allow = function() {
	return true;
}
A.allow({
	insert: allow,
	update: allow,
	remove: allow
});

if (Meteor.isServer) {
	A.remove({});
	var aId = A.insert({
		wot: 'wot'
	});
	console.log('initial A', A.find().fetch());

	Meteor.publish('testPublish', function() {
		console.log("in publish");
		var sub = this;
		var collectionName = 'a';
		var observeHandle = A.find().observeChanges({
			added: function(id, fields) {
				console.log("added", {id: id, fields: fields});
				fields.observe = "FIRST";
				sub.added(collectionName, id, fields);
			},
			changed: function(id, fields) {
				console.log("changed", {id: id, fields: fields});
				sub.changed(collectionName, id, fields);
			},
			removed: function(id) {
				console.log("removed", {id: id});
				sub.removed(collectionName, id);
			}
		});
		var observeHandle2 = A.find().observeChanges({
			added: function(id, fields) {
				console.log("added2", {id: id, fields: fields});
				fields.observe = "SECOND";
				sub.added(collectionName, id, fields);
			},
			changed: function(id, fields) {
				console.log("changed2", {id: id, fields: fields});
				sub.changed(collectionName, id, fields);
			},
			removed: function(id) {
				console.log("removed2", {id: id});
				sub.removed(collectionName, id);
			}
		});
		sub.onStop(function() {
			observeHandle.stop();
			observeHandle2.stop();
		});
		sub.ready();
	});
}

if (Meteor.isClient) {
	Tracker.autorun(function() {
		Meteor.subscribe('testPublish');
	});
	/*Meteor.subscribe('testPublish', function() {
		console.log(A.find().fetch());
	});*/
}
