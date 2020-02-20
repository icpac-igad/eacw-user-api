/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const chai = require('chai');
const mongoose = require('mongoose');
const UserModel = require('models/user');
const { USERS } = require('./utils/test.constants');
const { getTestServer } = require('./utils/test-server');
const { createUser } = require('./utils/helpers');

chai.use(require('chai-datetime'));

chai.should();

let requester;

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

describe('Get user by id tests', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestServer();
    });

    beforeEach(async () => {
        await UserModel.remove({}).exec();
    });

    // TODO: this should be a 4xx
    it('Get user by id for an invalid id should return a 500 error', async () => {
        const response = await requester
            .get(`/api/v1/user/1234`);

        response.status.should.equal(500);
        response.body.should.have.property('errors').and.be.an('array').and.length(1);
        response.body.errors[0].should.have.property('status').and.equal(500);
        response.body.errors[0].should.have.property('detail').and.equal('Cast to ObjectId failed for value "1234" at path "_id"');
    });

    it('Get user by id for an valid id that does not exist on the database should return a 404', async () => {
        const response = await requester
            .get(`/api/v1/user/${mongoose.Types.ObjectId()}`);

        response.status.should.equal(404);
        response.body.should.have.property('errors').and.be.an('array').and.length(1);
        response.body.errors[0].should.have.property('status').and.equal(404);
        response.body.errors[0].should.have.property('detail').and.equal('User not found');
    });

    // TODO: limit this endpoint to ADMIN users or your own data
    it('Get user by id should return a 200 and the user data (happy case)', async () => {
        const user = await new UserModel(createUser()).save();

        const response = await requester
            .get(`/api/v1/user/${user._id.toString()}`);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('object');
        response.body.data.should.have.property('type').and.equal('user');
        response.body.data.should.have.property('id').and.equal(user._id.toString());
        response.body.data.should.have.property('attributes').and.be.an('object');
        response.body.data.attributes.should.have.property('fullName').and.equal(user.fullName);
        response.body.data.attributes.should.have.property('email').and.equal(user.email);
        response.body.data.attributes.should.have.property('createdAt');
        new Date(response.body.data.attributes.createdAt).should.equalDate(user.createdAt);
        response.body.data.attributes.should.have.property('sector').and.equal(user.sector);
        response.body.data.attributes.should.have.property('primaryResponsibilities').and.include.members(user.primaryResponsibilities);
        response.body.data.attributes.should.have.property('country').and.equal(user.country);
        response.body.data.attributes.should.have.property('state').and.equal(user.state);
        response.body.data.attributes.should.have.property('city').and.equal(user.city);
        response.body.data.attributes.should.have.property('howDoYouUse').and.include.members(user.howDoYouUse);
        response.body.data.attributes.should.have.property('signUpForTesting').and.equal(user.signUpForTesting);
        response.body.data.attributes.should.have.property('language').and.equal(user.language);
        response.body.data.attributes.should.have.property('profileComplete').and.equal(user.profileComplete);
    });

    afterEach(async () => {
        await UserModel.remove({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});