(function(_) {
	if (Meteor.isServer) {
		var collections = {}; // dictionary of collections in the form {collectionName: collection}
	}
	Mongo.Collection.prototype.relate = function(relations) {
		if (Meteor.isServer) { // only saves collections on server to save memory because it is only needed on server
			collections[this._name] = this; // storing the collections here because the server Cursor has no way to retrieve the collection from a cursor
		}
		this._relations = relations;
		this.helpers(relations); // setup helpers for client side joins effectively
	};

	var Cursor = Meteor.isClient ? Mongo.Cursor : (new Mongo.Collection(' ')).find({_id: null}).constructor; // Cursor constructor is different on client and server
	Cursor.prototype._getCollection = function() {
		return Meteor.isClient ? this.collection : collections[this._getCollectionName()];
	};

	if (Meteor.isServer) {
		// handler is the function that returns the cursor
		var publishRelation = function(handler, context) {
			var sub = this;
			var cursor = handler.apply(context, Array.prototype.slice.call(arguments, 2));
			var collection = cursor._getCollection();
			if (_.has(collection, '_relations')) {
				var collectionName = collection._name,
					relations = collection._relations;

				var observeHandle = cursor.observeChanges({
					added: function(id, fields) {
						sub.added(collectionName, id, fields);
						/*_.each(relations, function(relationHandler) {
							var context = _.extend({
								_id: id
							}, fields);
							publishRelation.call(relationHandler, sub, context);
						});*/
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
		};

		Meteor.relationalPublish = function(name, handler) {
			Meteor.publish(name, function(/* arguments */) {
				var sub = this;
				var context = arguments;
				return publishRelation.call(sub, [handler, sub].concat(context));
			});
		};
	}
})(lodash);
