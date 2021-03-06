/* eslint-disable no-unused-vars,no-undef */
const nock = require('nock');
const chai = require('chai');
const UserModel = require('models/user');
const { USERS } = require('../utils/test.constants');
const { getTestServer } = require('../utils/test-server');
const { createUser } = require('../utils/helpers');

chai.use(require('chai-datetime'));

chai.should();

let requester;

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

describe('V1 - Update user tests', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestServer();
    });

    beforeEach(async () => {
        await UserModel.remove({}).exec();
    });

    it('Update a user while not being logged in should return a 401 \'Unauthorized\' error', async () => {
        const response = await requester
            .patch(`/api/v1/user/1234`);

        response.status.should.equal(401);
        response.body.should.have.property('errors').and.be.an('array').and.length(1);
        response.body.errors[0].should.have.property('status').and.equal(401);
        response.body.errors[0].should.have.property('detail').and.equal('Unauthorized');
    });

    it('Update a user while being logged in as a different user should return a 403 \'Forbidden\' error', async () => {
        const user = await new UserModel(createUser()).save();

        const response = await requester
            .patch(`/api/v1/user/${user._id.toString()}`)
            .send({
                loggedUser: USERS.USER
            });

        response.status.should.equal(403);
        response.body.should.have.property('errors').and.be.an('array').and.length(1);
        response.body.errors[0].should.have.property('status').and.equal(403);
        response.body.errors[0].should.have.property('detail').and.equal('Forbidden');
    });

    it('Update a user while being logged in with that user should return a 200 and the user data (happy case - no user data provided)', async () => {
        const user = await new UserModel(createUser()).save();

        const response = await requester
            .patch(`/api/v1/user/${user._id.toString()}`)
            .send({
                loggedUser: {
                    ...USERS.USER,
                    id: user._id.toString()
                }
            });

        response.status.should.equal(200);

        const responseUser = response.body.data;
        const databaseUser = await UserModel.findById(responseUser.id);

        responseUser.should.have.property('type').and.equal('user');
        responseUser.should.have.property('id').and.equal(databaseUser._id.toString());
        responseUser.should.have.property('attributes').and.be.an('object');
        responseUser.attributes.should.have.property('firstName').and.equal(databaseUser.firstName);
        responseUser.attributes.should.have.property('lastName').and.equal(databaseUser.lastName);
        responseUser.attributes.should.have.property('email').and.equal(databaseUser.email);
        responseUser.attributes.should.have.property('createdAt');
        new Date(responseUser.attributes.createdAt).should.equalDate(databaseUser.createdAt);
        responseUser.attributes.should.have.property('sector').and.equal(databaseUser.sector);
        responseUser.attributes.should.have.property('primaryResponsibilities').and.include.members(databaseUser.primaryResponsibilities);
        responseUser.attributes.should.have.property('country').and.equal(databaseUser.country);
        responseUser.attributes.should.have.property('state').and.equal(databaseUser.state);
        responseUser.attributes.should.have.property('city').and.equal(databaseUser.city);
        responseUser.attributes.should.have.property('howDoYouUse').and.include.members(databaseUser.howDoYouUse);
        responseUser.attributes.should.have.property('signUpForTesting').and.equal(databaseUser.signUpForTesting);
        responseUser.attributes.should.have.property('language').and.equal(databaseUser.language);
        responseUser.attributes.should.have.property('profileComplete').and.equal(databaseUser.profileComplete);
    });

    it('Update a user while being logged in should return a 200 and the updated user data (happy case)', async () => {
        const user = await new UserModel(createUser()).save();

        const response = await requester
            .patch(`/api/v1/user/${user._id.toString()}`)
            .send({
                loggedUser: {
                    ...USERS.USER,
                    id: user._id.toString()
                },
                fullName: `${user.fullName} updated`,
                email: `${user.email} updated`,
                sector: `${user.sector} updated`,
                country: `${user.country} updated`,
                state: `${user.state} updated`,
                city: `${user.city} updated`,
                aoiCity: `${user.aoiCity} updated`,
                aoiState: `${user.aoiState} updated`,
                aoiCountry: `${user.aoiCountry} updated`,
                language: `${user.language} updated`,
                profileComplete: !user.profileComplete,
                signUpForTesting: !user.signUpForTesting,
                primaryResponsibilities: [],
                howDoYouUse: []
            });

        response.status.should.equal(200);

        const responseUser = response.body.data;
        const databaseUser = await UserModel.findById(responseUser.id);

        responseUser.should.have.property('type').and.equal('user');
        responseUser.should.have.property('id').and.equal(databaseUser._id.toString());
        responseUser.should.have.property('attributes').and.be.an('object');
        responseUser.attributes.should.have.property('fullName').and.equal(databaseUser.fullName);
        responseUser.attributes.should.have.property('email').and.equal(databaseUser.email);
        responseUser.attributes.should.have.property('createdAt');
        new Date(responseUser.attributes.createdAt).should.equalDate(databaseUser.createdAt);
        responseUser.attributes.should.have.property('sector').and.equal(databaseUser.sector);
        responseUser.attributes.should.have.property('primaryResponsibilities').and.include.members(databaseUser.primaryResponsibilities);
        responseUser.attributes.should.have.property('country').and.equal(databaseUser.country);
        responseUser.attributes.should.have.property('state').and.equal(databaseUser.state);
        responseUser.attributes.should.have.property('city').and.equal(databaseUser.city);
        responseUser.attributes.should.have.property('aoiCountry').and.equal(databaseUser.aoiCountry);
        responseUser.attributes.should.have.property('aoiState').and.equal(databaseUser.aoiState);
        responseUser.attributes.should.have.property('aoiCity').and.equal(databaseUser.aoiCity);
        responseUser.attributes.should.have.property('howDoYouUse').and.include.members(databaseUser.howDoYouUse);
        responseUser.attributes.should.have.property('signUpForTesting').and.equal(databaseUser.signUpForTesting);
        responseUser.attributes.should.have.property('language').and.equal(databaseUser.language);
        responseUser.attributes.should.have.property('profileComplete').and.equal(databaseUser.profileComplete);
    });

    afterEach(async () => {
        await UserModel.remove({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
