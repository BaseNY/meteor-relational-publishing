/**
 * TODO
 * Add support for arguments in relation functions?
 * eg.
	A.find().relate(this, {
		b: function(<ARGUMENTS HERE>) {
			return B.find(this.bId);
		}
	});
 *
 */

/**
 * Pub/sub
 *
 * 1. observeChanges on cursors -> returns observeHandle
 * 2. sub.ready()
 * 3. sub.onStop -> stop all observeHandles
 */

var Cursor = (new Mongo.Collection(' ')).find({_id: null}).constructor;

Cursor.prototype._getSelectorAsKey = function() {
	var selector = this._cursorDescription.selector;
	return EJSON.stringify(selector, {canonical: true});
};

var publishCursor = function(sub, cursor) {
	var collectionName = cursor._getCollectionName();
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
	return observeHandle;
};

var setupRelations = function(id, fields, relations, handles) {
	if (_.isObject(relations)) {
		_.each(relations, function(relationHandler, fieldName) {
			// context so the handler will have access to fields
			var context = _.extend({
				_id: id
			}, fields);
			var res = relationHandler.call(context);
			if (res instanceof Cursor) {
				res = res.relate(sub);
			}
			handles[id][fieldName] = res;
		});
		sub.onStop(function() {
			_.each(handles[id], function(handle) {
				handle.stop();
			});
		});
	}
};

var stopHandles = function(id, handles) {
	if (handles[id]) {
		_.each(handles[id], function(handle, key) {
			handle.stop();
			delete handles[id][key];
		});
	}
};

var HandleList = function() {
	var self = this;

	self.handles = {};
	self.addHandle = function(fieldName, cursor, handle) {
		self.handles[fieldName][cursor._getSelectorAsKey] = handle;
	};
	self.stopAll = function() {
		_.each(handles, function(handleGroup) {
			_.each(handleGroup, function(handle) {
				handle.stop();
			});
		});
	};
};

// is a normal publish cursor function if relations is an object
Cursor.prototype.relate = function(sub, relations) {
	if (sub.isPublishWithRelations) {
		var cursor = this,
			collectionName = cursor._getCollectionName();

		var handles = {};
		var observeHandle = cursor.observeChanges({
			added: function(id, fields) {
				console.log("added", {id: id, fields: fields});
				sub.added(collectionName, id, fields);


				//setupRelations(id, fields, relations, handles);
				if (_.isObject(relations)) {
					_.each(relations, function(relationHandler, fieldName) {
						var context = _.extend({
							_id: id
						}, fields);
						var cursor = relationHandler.call(context);
						console.log(cursor._getSelectorAsKey());
						//handles[id][fieldName] = publishCursor(sub, cursor);
					});
				}
			},
			changed: function(id, fields) {
				console.log("changed", {id: id, fields: fields});
				sub.changed(collectionName, id, fields);

				//stopHandles(id, handles);
				//setupRelations(id, fields, relations, handles);
			},
			removed: function(id) {
				console.log("removed", {id: id});
				sub.removed(collectionName, id);

				//stopHandles(id, handles);
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
