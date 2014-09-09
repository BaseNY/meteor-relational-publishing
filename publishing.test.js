A = new Meteor.Collection('a');
B = new Meteor.Collection('b');

if(Meteor.isServer) {
    Meteor.startup(function() {
        A.insert({score:1, name: 'abc'});
        B.insert({score:1, name: 'def'});
    });
}

if(Meteor.isClient) {
    Meteor.subscribe('aRelational');
}
