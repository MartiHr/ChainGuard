import { expect } from "chai";
import { ethers } from "hardhat";

describe("ChainGuard", function () {
  it("Should store evidence with location data", async function () {
    const ChainGuard = await ethers.getContractFactory("ChainGuard");
    const chainGuard = await ChainGuard.deploy();
    await chainGuard.waitForDeployment();

    const [signer] = await ethers.getSigners();
    const cid = "QmahdJBPpwwheQMvKHnJEgs1NvnsFccxfPvcRUt9uKBsnk";
    const latitude = "42.6977";
    const longitude = "23.3219";

    // Store evidence
    await expect(
      chainGuard.storeEvidence(cid, true, signer.address, latitude, longitude)
    )
      .to.emit(chainGuard, "EvidenceStored")
      .withArgs(cid, signer.address, true, latitude, longitude);
  });

  it("Should retrieve evidence by user", async function () {
    const ChainGuard = await ethers.getContractFactory("ChainGuard");
    const chainGuard = await ChainGuard.deploy();
    await chainGuard.waitForDeployment();

    const [signer] = await ethers.getSigners();
    const cid = "QmahdJBPpwwheQMvKHnJEgs1NvnsFccxfPvcRUt9uKBsnk";
    const latitude = "42.6977";
    const longitude = "23.3219";

    // Store evidence
    await chainGuard.storeEvidence(cid, true, signer.address, latitude, longitude);

    // Retrieve evidence
    const evidence = await chainGuard.getEvidencesByUser(signer.address);
    expect(evidence.length).to.equal(1);
    expect(evidence[0].cid).to.equal(cid);
    expect(evidence[0].latitude).to.equal(latitude);
    expect(evidence[0].longitude).to.equal(longitude);
    expect(evidence[0].isPublic).to.equal(true);
  });

  it("Should retrieve public feed", async function () {
    const ChainGuard = await ethers.getContractFactory("ChainGuard");
    const chainGuard = await ChainGuard.deploy();
    await chainGuard.waitForDeployment();

    const [signer] = await ethers.getSigners();
    const cid1 = "QmahdJBPpwwheQMvKHnJEgs1NvnsFccxfPvcRUt9uKBsnk";
    const cid2 = "bafybeidiop2nneprrfv55trwka7y2wljlbqtyg53h4hoytoetggxz7uidi";
    const latitude = "42.6977";
    const longitude = "23.3219";

    // Store one public and one private evidence
    await chainGuard.storeEvidence(cid1, true, signer.address, latitude, longitude);
    await chainGuard.storeEvidence(cid2, false, signer.address, latitude, longitude);

    // Retrieve public feed
    const publicFeed = await chainGuard.getPublicFeed();
    expect(publicFeed.length).to.equal(1);
    expect(publicFeed[0].cid).to.equal(cid1);
    expect(publicFeed[0].isPublic).to.equal(true);
  });

  it("Should prevent duplicate evidence", async function () {
    const ChainGuard = await ethers.getContractFactory("ChainGuard");
    const chainGuard = await ChainGuard.deploy();
    await chainGuard.waitForDeployment();

    const [signer] = await ethers.getSigners();
    const cid = "QmahdJBPpwwheQMvKHnJEgs1NvnsFccxfPvcRUt9uKBsnk";
    const latitude = "42.6977";
    const longitude = "23.3219";

    // Store evidence
    await chainGuard.storeEvidence(cid, true, signer.address, latitude, longitude);

    // Try to store the same evidence again
    await expect(
      chainGuard.storeEvidence(cid, true, signer.address, latitude, longitude)
    ).to.be.revertedWith("Evidence already exists");
  });
});
