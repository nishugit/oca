const assert = require('assert');
const Oca = require('../../../src');

const Input = Oca.Input;


describe('Generic Object Input:', () => {

  it('Input should start empty', () => {
    const input = Input.create('input: any');
    assert.equal(input.value, null);
  });

  it('A class should not be considered an object', (done) => {
    const input = Input.create('input: any', {defaultValue: Date});
    input.validate.bind(input)().then((value) => {
      done(new Error('Not Expected!'));
    }).catch((err) => {
      done();
    });
  });

  it('Date should be considered as an object', (done) => {
    const input = Input.create('input: any', {defaultValue: new Date()});
    input.validate.bind(input)().then((value) => {
      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('Parsing and serialization should not be available for Any', (done) => {

    (async () => {

      const input = Input.create('input: any');

      let parseFailed = false;
      try{
        input.parseValue('Some Value');
      }
      catch(err){
        parseFailed = true;
      }

      if (!parseFailed){
        done(new Error('Parsing fail'));
        return;
      }

      input.value = new Date();

      await input.serializeValue();

    })().then((result) => {
      done(new Error('unexpected value'));
    }).catch((err) => {
      done((err.message === 'Cannot be serialized!') ? null : new Error('unexpected error'));
    });
  });

  class A{}
  class B extends A{}

  it('Object B should match as instance of A', (done) => {
    const input = Input.create('input: any', {type: A});
    input.value = new B();
    input.validate.bind(input)().then((value) => {
      done();
    }).catch((err) => {
      done(err);
    });
  });

  it('Object Date should not match as instance of B', (done) => {
    const input = Input.create('input: any', {type: B});
    input.value = new Date();
    input.validate.bind(input)().then((value) => {
      done(new Error('It should have failed'));
    }).catch((err) => {
      done();
    });
  });
});
