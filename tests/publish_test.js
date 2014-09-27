var A = new Mongo.Collection('a');
var B = new Mongo.Collection('b');
var C = new Mongo.Collection('c');

if (Meteor.isServer) {
	// clear collections
	A.remove({});
	B.remove({});
	C.remove({});

	// for making sure that relate throws an error
	Meteor.publish('meteorPublish', function() {
		return A.find().relate();
	});

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

	Meteor.relationalPublish('regularPublish', function(params) {
		params = params || {};
		if (params.relate) {
			return A.find().relate();
		} else {
			return A.find();
		}
	});

	Meteor.relationalPublish('B in A', function() {
		return A.find().relate({
			b: function() {
				return B.find(this.bId);
			}
		});
	});

	Meteor.relationalPublish('C in B in A', function() {
		return A.find().relate({
			b: function() {
				return B.find(this.bId).relate({ // the this in this relate is not the correct one
					c: function() {
						return C.find(this.cId);
					}
				});
			}
		});
	});

	Meteor.relationalPublish('C and B in A', function() {
		return A.find().relate({
			b: function() {
				return B.find(this.bId);
			},
			c: function() {
				return C.find(this.cId);
			}
		});
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

	Tinytest.addAsync("Relational Publishing - Cursor.prototype.relate error in Meteor.publish", function(test, next) {
		var callback = function(err) {
			test.isTrue(err instanceof Error, "Expected an error to be thrown because Cursor.prototype.relate shouldn't be called in Meteor.publish");
			next();
		};
		Meteor.subscribe('meteorPublish', {
			onReady: callback,
			onError: callback
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
		},
		// testing relate without any arguments - it should act the same as just calling find
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
				relate: true
			}, {
				onReady: callback,
				onError: callback
			});
		},
		// unsubscribe again
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

	var unsubscribeCollections = function(callback) {
		Meteor.subscribe('unsubscribe', {
			onReady: callback,
			onError: callback
		});
	};

	Tinytest.addAsync("Relational Publishing - Relations - B in A", function(test, next) {
		test.collectionEmpty(A);
		var callback = function(err) {
			if (err) {
				test.exception(err);
			} else {
				test.collectionNotEmpty(A);
				test.collectionNotEmpty(B);
			}
			next();
		};
		Meteor.subscribe('B in A', {
			onReady: callback,
			onError: callback
		});
	});

	Tinytest.addAsync("Relational Publishing - Relations - C in B in A", function(test, next) {
		unsubscribeCollections(function(err) {
			if (err) {
				test.exception(err);
			} else {
				test.collectionEmpty(A);
			}
			next();
		});
	});
}
