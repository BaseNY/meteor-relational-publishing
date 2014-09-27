var Cursor = (new Mongo.Collection(' ')).find({_id: null}).constructor;

Meter.publishWithRelations('test', function() {
	return A.find().relate(this, {
		b: function() {
			return B.find().relate(this, {
				c: function() {
					return C.find();
				}
			});
		}
	});
});

Cursor.prototype.relate = function(sub, relations) {
	if (sub.isPublishWithRelations) {
		var cursor = this,
			collectionName = cursor._getCollectionName();

		var handles = {};
		var relationIdSet = sub.relationIds;
		var childrenRelationIdSet = new CounterHashSet;
		var observeHandle = cursor.observeChanges({
			added: function(id, fields) {
				// if 
				if (relationIdSet.add(id) === 1) {
					sub.added(collectionName, id, fields);
				}
			},
			changed: function(id, fields) {
				sub.changed(collectionName, id, fields);
			},
			removed: function(id) {
			}
		});
		return observeHandle;
	} else {
		throw new Error("Cursor.prototype.relate can only be called in Meteor.publishWithRelations.");
	}
};

Meteor.publishWithRelations = function(name, handler) {
	Meteor.publish(name, function() {
		var self = this;
		self.isPublishWithRelations = true; // set this to true to make sure that Cursor.prototype.relate can only run in Meteor.publishWithRelations
		var res = handler.apply(self, arguments); // pass context to handler
		delete self.isPublishWithRelations;
		if (res instanceof Cursor) {
			return res; // just return the cursor if normal publish
		} else { // handler should return observeHandle if relate
			self.onStop(function() {
				res.stop();
			});
			self.ready();
		}
	});
};
