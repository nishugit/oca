const assert = require('assert');
const Oca = require('../../../src');

const Input = Oca.Input;


describe('UUID Input:', () => {

  it('Input should start empty', () => {
    const input = Input.create('input: uuid');
    assert.equal(input.value, null);
  });

  it('UUID value should be accepted', (done) => {
    const input = Input.create('input: uuid');
    input.value = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

    input.validate.bind(input)().then((value) => {
      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('Invalid UUID value should be allowed', (done) => {
    const input = Input.create('input: uuid');
    input.value = 'some-invalid-id';

    input.validate.bind(input)().then((value) => {
      done(new Error('unexpected value'));
    }).catch((err) => {
      done();
    });
  });

  it('Should set the input with a new time based id (v1)', (done) => {
    const input = Input.create('input: uuid');
    input.setNewTimeBasedId();

    input.validate.bind(input)().then((value) => {
      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('Should fail to set a vector input with a new time based id (v1)', () => {
    const input = Input.create('input: uuid[]');
    let error = null;

    try{
      input.setNewTimeBasedId();
    }
    catch(err){
      error = err;
    }

    if (error === null){
      throw new Error('Unexpected result');
    }
    else{
      assert.equal(error.message, 'Not supported, input is a vector!');
    }
  });

  it('Should set the input with a new random id (v4)', (done) => {
    const input = Input.create('input: uuid');
    input.setNewRandomId();

    input.validate.bind(input)().then((value) => {
      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('Should fail to set a vector input with a new random id (v4)', () => {
    const input = Input.create('input: uuid[]');
    let error = null;

    try{
      input.setNewRandomId();
    }
    catch(err){
      error = err;
    }

    if (error === null){
      throw new Error('Unexpected result');
    }
    else{
      assert.equal(error.message, 'Not supported, input is a vector!');
    }
  });
});
