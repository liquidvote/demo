// Given a collection of users, tally up the votes for a proposed item.
// See https://github.com/Crowdocracy/liquid-api/issues/5 for full db schemas.

'use strict'

var _ = require('lodash')

// -------------------------
// Prep work for example context
// -------------------------

var voters = require('./example-voters.js') // voters.length === 8
// console.log(voters[4])
// // {
// //   uid: 'e',
// //   full_name: 'Eva Ernst',
// //   delegate: 'a'
// // }

var bill = {
  uid: 'exampleItem',
  name: 'Example Item',
  author: 'e', // voter_uid of 'Eva Ernst'
  body: '',
  date_introduced: new Date('Mon Sep 12 2016 04:34:21 GMT-0700 (PDT)'),
  date_of_vote: new Date('Fri Sep 16 2016 17:00:00 GMT-0700 (PDT)'),
  votes_yea: 0, // these tally values all default to 0
  votes_yea_from_delegate: 0,
  votes_nay: 0,
  votes_nay_from_delegate: 0,
  votes_no_vote: 0,
}

// Generate random votes on exampleItem for all our users
var votes = require('./generate-random-votes.js')(voters)

// Create indices for quick lookups
var votersByUid = _.keyBy(voters, 'uid')
var votesByVoterUid = _.keyBy(votes, 'voter_uid')

// -------------------------
// Now the actual vote-tallying alorithm begins
// -------------------------

// declare cycleState so resolveIndividualsPosition has access
var cycleState

// Given a voter and the record of all votes,
// return that individual's voter position (recursive)
function resolveIndividualsPosition(voter, votesByVoterUid) {
  // Did the voter explicitly vote?
  if (votesByVoterUid.hasOwnProperty(voter.uid)) {
    return votesByVoterUid[voter.uid].position
  }

  // Protect against endless cycle of no-show votes
  cycleState.hare = votersByUid[cycleState.hare.delegate]
  if (!votesByVoterUid.hasOwnProperty(cycleState.hare.uid)) {
    cycleState.hare = votersByUid[cycleState.hare.delegate]
    if (!votesByVoterUid.hasOwnProperty(cycleState.hare.uid)) {
      cycleState.tortoise = votersByUid[cycleState.tortoise.delegate]
      if (cycleState.hare === cycleState.tortoise) {
        return 'no_vote'
      }
    }
  }

  // Otherwise inherit their delegate's position
  var delegate = votersByUid[voter.delegate]
  return resolveIndividualsPosition(delegate, votesByVoterUid)
}


// Tally up the votes by iterating through each voter
voters.forEach(function (voter) {
  // reset cycleState to implement Floyd's Cycle-Finding Algorithm
  cycleState = {
    tortoise: voter,
    hare: voter,
  }

  var position = resolveIndividualsPosition(voter, votesByVoterUid, cycleState)
  var isDelegated = !votesByVoterUid.hasOwnProperty(voter.uid)

  // increment tally counter for the appropriate key
  var tallyKey = 'votes_' + position
  if (position !== 'no_vote' && isDelegated) {
    tallyKey += '_from_delegate'
  }
  bill[tallyKey]++
  console.log(voter.full_name, tallyKey)
})

console.log('\nbill:', bill)

// Calculate and print the effective final tallies
var finalTally = {
  yea: bill.votes_yea + bill.votes_yea_from_delegate,
  nay: bill.votes_nay + bill.votes_nay_from_delegate,
  voted: voters.length - bill.votes_no_vote, // is there a quorum?
  potential_voters: voters.length,
  delegated: bill.votes_yea_from_delegate
    + bill.votes_nay_from_delegate,
}
console.log('\nfinalTally:', finalTally)
