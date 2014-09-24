var IsRelationalPublish = new Meteor.EnvironmentVariable;

var Cursor = (new Mongo.Collection(' ')).find({_id: null}).constructor;

/**
 * Doesn't do anything when called in Meteor.publish.
 * The cursor is just passed along.
 */
Cursor.prototype.relate = function(relations) {
	if (IsRelationalPublish.get()) {
		this.relations = relations || {};
		return this;
	} else {
		throw new Error("Cursor.prototype.relate can only be called in Meteor.relationalPublish.");
	}
};

// handler supposedly runs in a Fiber
Meteor.relationalPublish = function(name, handler) {
	Meteor.publish(name, (function() {
		var publishHandler = function(/* arguments */) {
			var sub = this, args = arguments;

			var cursor = IsRelationalPublish.withValue(true, function() {
				return handler.apply(sub, args);
			});
			var collectionName = cursor._getCollectionName();
			if (_.has(cursor, 'relations')) {
				var relations = cursor.relations;
				var observeHandle = cursor.observeChanges({
					added: function(id, fields) {
						sub.added(collectionName, id, fields);
					},
					changed: function(id, fields) {
						sub.changed(collectionName, id, fields);
					},
					removed: function(id) {
						sub.removed(collectionName, id);
					}
				});
				sub.onStop(function() {
					observeHandle.stop();
				});
				sub.ready();
			} else {
				return cursor;
			}
		}
		return publishHandler;
	})());
};

/*
Meteor.relationalPublish('test', function() {
	return A.find().relate({
		b: function(a) {
			return B.find(a.bId).relate({
				c: function(b) {
					return C.find(b.cId);
				}
			});
		}
	});
});

// OR

Meteor.relationalPublish('test', function() {
	return A.find().relate({
		b: function() {
			return B.find(this.bId).relate({
				c: function() {
					return C.find(this.cId);
				}
			});
		}
	});
});
*/
