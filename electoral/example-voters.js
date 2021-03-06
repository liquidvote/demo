var firstNames = require('./corpora/firstNames.json').firstNames
var lastNames = require('./corpora/lastNames.json').lastNames
var _ = require('lodash')

function startsWith(letter, item) {
  return item[0].toLowerCase() === letter.toLowerCase()
}

var electedRep = [{
  uid: 'a',
  full_name: 'Mitch McConnell',
  delegate: 'b',
}]

module.exports = electedRep.concat('bcdefghijklmnopqrstuvwxyz'.split('').map(function (uid) {
  var sameFirstLetter = _.curry(startsWith, 2)(uid)
  var randomFirstName = _.sample(firstNames.filter(sameFirstLetter))
  // var randomLastName = _.sample(lastNames.filter(sameFirstLetter))

  return {
    uid: uid,
    full_name: randomFirstName,
    delegate: 'a',
  }
}))
