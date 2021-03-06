var test = require('tape')
var bigInt = require('big-integer')
var sequenceName = 'block-sequence-compliance-tests'

module.exports = function(blockSequence) {

    test('Block Sequence', function(t) {

        t.test('should ensure a sequence exists', function(t) {
            blockSequence.remove({ name: sequenceName }, function(err) {
                err && t.ifError(err)
                blockSequence.ensure({ name: sequenceName, value: 10 }, function(err, sequence) {
                    err && t.ifError(err)
                    t.equal(sequence.name, sequenceName, 'sequence name is correct')
                    t.equal(sequence.value, 10, 'value is correct')
                    t.end()
                })
            })
        })

        t.test('should ensure sequence is created with custom metadata', function(t) {
            blockSequence.remove({ name: sequenceName }, function(err) {
                err && t.ifError(err)
                blockSequence.ensure({ name: sequenceName, value: 11, metadata: { info: 'additional info' } }, function(err, sequence) {
                    err && t.ifError(err)
                    t.equal(sequence.value, 11, 'value is correct')
                    t.equal(sequence.metadata.info, 'additional info', 'metadata is correct')
                    t.end()
                })
            })
        })

        t.test('should error when sequence is too big', function(t) {
            blockSequence.remove({ name: sequenceName }, function(err) {
                err && t.ifError(err)
                blockSequence.ensure({ name: sequenceName, value: bigInt(Number.MAX_SAFE_INTEGER).plus(1).toString() }, function(err, sequence) {
                    t.equal(err.message, 'Sequence value exceeds Number.MAX_SAFE_INTEGER', 'message is correct')
                    t.end()
                })
            })
        })


        t.test('should allocate a block of ids', function(t) {
            blockSequence.remove({ name: sequenceName }, function(err) {
                err && t.ifError(err)
                blockSequence.allocate({ name: sequenceName, size: 12 }, function(err, block) {
                    err && t.ifError(err)
                    t.equal(block.name, sequenceName, 'block name is correct')
                    t.equal(block.next, 1, 'next is correct')
                    t.equal(block.remaining, 12, 'remaining is correct')
                    t.end()
                })
            })
        })

        t.test('should allocate a second block of ids', function(t) {
            blockSequence.remove({ name: sequenceName }, function(err) {
                err && t.ifError(err)
                blockSequence.allocate({ name: sequenceName, size: 13 }, function(err, block) {
                    err && t.ifError(err)
                    blockSequence.allocate({ name: sequenceName, size: 14 }, function(err, block) {
                        err && t.ifError(err)
                        t.equal(block.name, sequenceName, 'block name is correct')
                        t.equal(block.next, 14, 'next is correct')
                        t.equal(block.remaining, 14, 'remaining is correct')
                        t.end()
                    })
                })
            })
        })

        t.test('should default to a block size of 1', function(t) {
            blockSequence.remove({ name: sequenceName }, function(err) {
                err && t.ifError(err)
                blockSequence.allocate({ name: sequenceName }, function(err, block) {
                    err && t.ifError(err)
                    t.equal(block.remaining, 1, 'remaining is correct')
                    t.end()
                })
            })
        })

        t.test('should force lowercase sequence names when allocating a block', function(t) {
            blockSequence.remove({ name: sequenceName }, function(err) {
                err && t.ifError(err)
                blockSequence.allocate({ name: sequenceName, size: 15 }, function(err, block) {
                    err && t.ifError(err)
                    blockSequence.allocate({ name: sequenceName.toUpperCase(), size: 16 }, function(err, block) {
                        err && t.ifError(err)
                        t.equal(block.name, sequenceName, 'block name is correct')
                        t.equal(block.next, 16, 'next is correct')
                        t.end()
                    })
                })
            })
        })

        t.test('should require sequence names when allocating a block', function(t) {
            blockSequence.allocate({ name: null }, function(err, block) {
                t.equal(err.message, 'name is required', 'message is correct')
                t.end()
            })
        })

        t.test('should return custom block metadata', function(t) {
            blockSequence.remove({ name: sequenceName }, function(err) {
                err && t.ifError(err)
                blockSequence.allocate({ name: sequenceName, size: 17, metadata: { info: 'additional info' } }, function(err, block) {
                    err && t.ifError(err)
                    t.equal(block.next, 1, 'next is correct')
                    t.equal(block.metadata.info, 'additional info', 'metadata is correct')
                    t.end()
                })
            })
        })

        t.test('should omit sequence value', function(t) {
            blockSequence.remove({ name: sequenceName }, function(err) {
                err && t.ifError(err)
                blockSequence.allocate({ name: sequenceName, size: 18 }, function(err, block) {
                    err && t.ifError(err)
                    t.notOk(block.hasOwnProperty('value'), 'sequence value was not omitted')
                    t.end()
                })
            })
        })

        t.test('should error when block busts max safe integer', function(t) {
            blockSequence.remove({ name: sequenceName }, function(err) {
                err && t.ifError(err)
                blockSequence.ensure({ name: sequenceName, value: 10 }, function(err, sequence) {
                    err && t.ifError(err)
                    blockSequence.allocate({ name: sequenceName, size: Number.MAX_SAFE_INTEGER - 9 }, function(err, block) {
                        t.equal(err.message, 'Sequence value exceeds Number.MAX_SAFE_INTEGER', 'message is correct')
                        t.end()
                    })
                })
            })
        })

        t.test('should allocate blocks atomicly', function(t) {
            blockSequence.remove({ name: sequenceName }, function(err) {
                err && t.ifError(err)
                var blocks = []
                for (var i = 0; i < 1000; i++) {
                    blockSequence.allocate({ name: sequenceName, size: 19 }, function(err, block) {
                        err && t.ifError(err)
                        blocks.push(block.next)
                        if (blocks.length === 1000) {
                            blocks.sort(function sortNumber(a, b) {
                                return a - b;
                            });

                            var passed = true
                            for (var i = 0; i < 1000; i++) {
                                var actual = blocks[i]
                                var expected = (i * 19) + 1
                                if (actual !== expected) {
                                    t.fail('Block ' + i + ' was ' + actual + ' but should have been ' + expected)
                                    passed = false
                                }
                            }
                            if (passed) t.pass('OK')

                            t.end()
                        }
                    })
                }
            })
        })

        t.test('should not redefine a sequence', function(t) {
            blockSequence.remove({ name: sequenceName }, function(err) {
                err && t.ifError(err)
                blockSequence.ensure({ name: sequenceName, value: 20 }, function(err, sequence) {
                    err && t.ifError(err)
                    blockSequence.ensure({ name: sequenceName, value: 21 }, function(err, sequence) {
                        err && t.ifError(err)
                        t.equal(sequence.value, 20, 'value is correct')
                        t.end()
                    })
                })
            })
        })

        t.test('should create sequences only once', function(t) {
            blockSequence.remove({ name: sequenceName }, function(err) {
                err && t.ifError(err)
                var blocks = 0
                for (var i = 0; i < 1000; i++) {
                    blockSequence.ensure({ name: sequenceName, value: 100 }, function(err, block) {
                        err && t.ifError(err)
                        if (++blocks === 1000) {
                            t.equal(block.value, 100, 'value is correct')
                            t.end()
                        }
                    })
                }
            })
        })

        t.test('should require sequence names when ensuring a sequence', function(t) {
            blockSequence.ensure({ name: null }, function(err, block) {
                t.equal(err.message, 'name is required', 'message is correct')
                t.end()
            })
        })

        t.test('should require sequence names when removing a block', function(t) {
            blockSequence.remove({ name: null }, function(err, block) {
                t.equal(err.message, 'name is required', 'message is correct')
                t.end()
            })
        })
    })

    return test
}
