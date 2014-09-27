var A = new Mongo.Collection('a');
var B = new Mongo.Collection('b');
var C = new Mongo.Collection('c');

A.relate({
	b: function() {
		return B.find(this.bId);
	}
});

if (Meteor.isServer) {
	Kadira.connect('67toKvx22CmkgzxKP', '49e955c5-8b78-4def-b1e7-c60046b36cdc');
	// clear collections
	A.remove({});
	B.remove({});
	C.remove({});

	Meteor.publish('unsubscribe', function() {
		var selector = {_id: null};
		return [
			A.find(selector),
			B.find(selector),
			C.find(selector)
		];
	});

	var cId = C.insert({
		cField: 'c field'
	});

	var bId = B.insert({
		bField: 'b field',
		cId: cId
	});

	var a1 = A.insert({
		field: 'data',
		bId: bId,
		cId: cId
	});

	var a2 = A.insert({
		field: 'more data',
		bId: bId,
		cId: cId
	});

	Meteor.relationalPublish('regularPublish', function() {
		return A.find();
	});
}

if (Meteor.isClient) {
	Tinytest.add("Relational Publishing - Extending TestCaseResults", function(test) {
		_.extend(test.constructor.prototype, {
			collectionEmpty: function(collection) {
				this.equal(collection.find().count(), 0, "Expected no documents to be found because not subscribed yet");
			},
			collectionNotEmpty: function(collection) {
				this.isTrue(collection.find().count() > 0, "Expected a document to be found in collection: " + collection._name);
			},
			expectError: function(err) {
				this.isTrue(err instanceof Error, "Expected an error to be thrown");
			}
		});
	});

	testAsyncMulti("Relational Publishing - Regular publish functionality works", [
		// normal publish
		function(test, expect) {
			test.collectionEmpty(A);
			var callback = expect(function(err) {
				if (err) {
					test.exception(err);
				} else {
					test.collectionNotEmpty(A);
				}
				subHandle.stop();
			});
			var subHandle = Meteor.subscribe('regularPublish', {
				onReady: callback,
				onError: callback
			});
		},
		// unsubscribe
		function(test, expect) {
			var callback = expect(function(err) {
				err && test.exception(err);
			});
			Meteor.subscribe('unsubscribe', {
				onReady: callback,
				onError: callback
			});
		}
	]);
}
