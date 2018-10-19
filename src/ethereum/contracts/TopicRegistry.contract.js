import web3 from '../web3';
import web3config from '../web3-config.json';
import { getAddresses } from './addresses';
import { getBranch, getABI } from './helpers';

class TopicRegistry {
  async init() {
    const { TOPIC_REGISTRY_ADDRESS } = getAddresses(web3config.netid);
    const branch = getBranch(web3config.netid);

    const topicRegistryAbi = await getABI(branch, 'TopicRegistry');
    this.topicRegistryInstance = new web3.eth.Contract(topicRegistryAbi.abi, TOPIC_REGISTRY_ADDRESS);
  }

  async getTopic(topicID) {
    // Validate ABI
    if (! this.topicRegistryInstance.methods.topics) {
      return null;
    }

    // Call
    return this.topicRegistryInstance.methods.topics(topicID).call();
  }

  // TODO
  async getAllTopic() {
    return;
  }
}

export {TopicRegistry}