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
		if (params.unsubscribe) {
			return A.find({_id: null});
		} else if (params.relate) {
			return A.find().relate();
		} else {
			return A.find();
		}
	});

	Meteor.relationalPublish('B_in_A', function() {
		return A.find().relate(this, {
			b: function() {
				return B.find(this.bId);
			}
		});
	});

	Meteor.relationalPublish('C_in_B_in_A', function() {
		var sub = this;
		return A.find().relate(sub, {
			b: function() {
				return B.find(this.bId).relate(sub, { // the this in this relate is not the correct one
					c: function() {
						return C.find(this.cId);
					}
				});
			}
		});
	});

	Meteor.relationalPublish('C_and_B_in_A', function() {
		return A.find().relate(this, {
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
				this.isTrue(A.find().count() > 0, "Expected a document to be found");
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
		// unsubscribing
		function(test, expect) {
			var callback = expect(function(err) {
				err && test.exception(err);
			});
			Meteor.subscribe('regularPublish', {
				unsubscribe: true
			}, {
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
		}
	]);

/*	Tinytest.addAsync("Relational Publishing - Relations", function(test, next) {
		var onError = function(err) {
			test.exception(err);
			next();
		};
		Meteor.subscribe('regularPublish', true, {
			onReady: function() {
				test.isCollectionEmpty(A);
				Meteor.subscribe('bInA', {
					onReady: function() {
						console.log('A', A.find().fetch());
						//console.log('B', B.find().fetch());
						next();
					},
					onError: onError
				});
			},
			onError: onError
		});
	});*/
}
