WYMSYstack = function(options) {
    this.options = options;
	this.datastore = [];
	this.keyIdx = 0;
	
	if (1) {
		this.console = console;
	} else {
		this.console = function() {};
		this.console.log = function() {};
	}
};

WYMSYstack.prototype.store = function(value) {
	this.datastore[this.keyIdx] = value;
	this.console.log('WYMSYstack:: Storing [' + this.keyIdx + '] "' + value + '"');
	return(this.keyIdx++);
};

WYMSYstack.prototype.take = function(key) {
	tmp = this.get(key);
	// Free up some memory
	delete this.datastore[key];
	this.console.log('WYMSYstack:: Deleting [' + key + '] ');
	return tmp;
};

WYMSYstack.prototype.get = function(key) {
	tmp = this.datastore[key];
	if (typeof(tmp) != 'undefined') {
		this.console.log('WYMSYstack:: Getting [' + key + '] "' + tmp + '"');
		return tmp;
	} else {
		this.console.log('WYMSYstack:: Tried to take [' + key + '] but it\'s not found');
		return '';
	}
};
