CounterHashSet = function() {
	this._dict = {}; // should only have values of true

	this.contains = function(key) {
		return this._dict[key];
	};

	this.add = function(key) {
		if (this.contains(key)) {
			++this._dict[key];
		} else {
			this._dict[key] = 1;
		}
		return this._dict[key];
	};

	this.remove = function(key) {
		if (this.contains[key]) {
			if (this._dict[key] === 1) {
				delete this.dict[key];
			} else {
				--this._dict[key];
			}
		}
	};

	/**
	 * Returns whether the set contained the key before it was removed.
	 */
	this.checkAndRemove = function(key) {
		var contains = this.contains(key);
		this.remove(key);
		return contains;
	};
};
