import React from 'react';
import { Table, Input, Modal, Row, Col, Button, Select, Form, Tabs, Progress, message } from 'antd';
import { SendTransaction } from 'metasdk-react';

import web3 from '../ethereum/web3';
import { columns } from './columns';
import * as util from '../util';

const tableColumns = columns.achievementColumns;
const detailColumns = columns.achievementDetailColumns;

class Achievement extends React.Component {

  data = {
    items: [],
    localStorageItem: [],
    originItems: [],
    topics: [],
    originClaimTopics: [],
    newAchievementItem: { title: '', topic: [], explanation: '', reward: '' },
    inputValidData: [],
    topicIssuerMap: [],
    panes: [],
    activeKey: '0',
    tabIndex: 1,
    loadedAchieveCnt: 0,
    totalAchieveCnt: 1,
  };

  state = {
    addModalVisible: false,
    qrVisible: false,
    didTabChange: false,
    didSearch: false,
    loading: false,
    getTopicInfo: false,
    getAchievementInfo: false,
  };

  componentWillMount() {
    if (this.data.topics.length > 0) return;

    let topics = util.getTopicsFromLocal();

    if (topics) {
      this.data.topics = topics;
      this.data.originClaimTopics = topics.map(val => <Select.Option key={val.id}>{val.title}:{val.explanation}</Select.Option>);
      this.setState({ getTopicInfo: true });
    } else this.props.contracts.topicRegistry.getAllTopic({
      handler: ret => { if (ret) this.data.topics = [...this.data.topics, util.refine(ret)] },
      cb: () => {
        util.setTopicsToLocal(this.data.topics);
        this.data.originClaimTopics = this.data.topics.map(val => <Select.Option key={val.id}>{val.title}:{val.explanation}</Select.Option>);
        this.setState({ getTopicInfo: true });
      }
    });
  }

  async achievementDynamicLoading() {
    this.data.totalAchieveCnt = await this.props.contracts.achievementManager.getLengthOfAchievements();
    this.props.contracts.achievementManager.getAllAchievements({
      handler: ret => this.addAchievement(ret),
      cb: () => { this.data.loadedAchieveCnt = this.data.totalAchieveCnt; this.setState({ loading: true }); }
    });
  }

  componentDidMount() {
    this.achievementDynamicLoading();

    // Init tab value
    this.data.panes.push({ title: 'New Topic', content: '', topic: [], key: this.data.activeKey, closable: false });
    this.data.newAchievementItem.topic.push({ title: '', id: -1, issuer: '', key: this.data.activeKey });

    this.setState({ didTabChange: true });
  }

  addAchievement = async (ret) => {
    ++this.data.loadedAchieveCnt;
    if (! ret) return;
    let newItem = await this.getAchievementFromMap(ret);
    this.data.items = [...this.data.items, newItem];
    this.data.originItems = this.data.items;
    this.setState({ getAchievementInfo: true });
  }

  async getClaimTopic(claimTopics) {
    var rtn = [];
    await util.asyncForEach(claimTopics, async (element) => {
      var topic = await this.props.contracts.topicRegistry.getTopic(element);
      topic['id'] = element;
      rtn.push(util.refine(topic));
    });
    return rtn;
  }

  async getAchievementFromMap(m) {
    util.refine(m);
    if (m.claimTopics) m.claimTopics = await this.getClaimTopic(m.claimTopics);
    return m;
  }

  updateNewAchieveInfo = (e) => {
    switch (e.target.id) {
      case 'title':
      case 'explanation':
        if (util.isValidLength(e.target.value) > 32) {
          message.error('Please fill up all red box!');
          e.target.style.borderColor = 'red';
          e.target.value = this.data.inputValidData[e.target.id];
        } else e.target.style.borderColor = '#3db389';

        this.data.inputValidData[e.target.id] = e.target.value;
        this.data.newAchievementItem[e.target.id] = e.target.value;
        break;
      case 'reward':
        if (e.target.value < 5) e.target.style.borderColor = 'red';
        else { 
          e.target.style.borderColor = '#3db389'; 
          this.data.newAchievementItem[e.target.id] = e.target.value;
        }
        break;
      case 'issuer':
        if( ! e.target.value || ! web3.utils.isAddress(e.target.value)) {
          e.target.style.borderColor = 'red';
          message.error('Please fill up correct address!');
        } else {
          e.target.style.borderColor = '#3db389'; 
          Object.values(this.data.panes).forEach((element, i) => {
            if (element.key === this.data.activeKey) this.data.newAchievementItem.topic[i].issuer = e.target.value;
          });
        }
        break;
      default: break;
    }
  }

  onSearch(value) {
    var regex = new RegExp(value, 'i');
    if (! value) this.data.items = this.data.originItems;
    else this.data.items = this.data.originItems.filter(element => Object.values(element).filter(val => val.toString().match(regex)).length > 0);
    this.setState({ didSearch: true });
  }

  onTabsChange = (activeKey) => {
    this.data.activeKey = activeKey;
    this.setState({ didTabChange: true });
  }

  onTabsEdit = (targetKey, action) => {
    this[action](targetKey);
  }

  add = () => {
    this.data.activeKey = (this.data.tabIndex++).toString();
    this.data.panes.push({ title: 'New Topic', content: 'Content of new tab', key: this.data.activeKey });
    this.data.newAchievementItem.topic.push({ title: '', id: -1, issuer: '', key: this.data.activeKey });
    this.setState({ didTabChange: true });
  }
  
  remove = (targetKey) => {
    let lastIndex = 0;
    this.data.panes.forEach((pane, i) => { if (pane.key === targetKey) lastIndex = i - 1; });

    const newTopicItems = this.data.newAchievementItem.topic.filter(element => element.key !== targetKey);
    const panes = this.data.panes.filter(pane => pane.key !== targetKey);
    this.data.newAchievementItem.topic = newTopicItems;
    this.data.activeKey = panes[lastIndex].key;
    this.data.panes = panes;
    this.setState({ didTabChange: true });
  }

  onTopicClick = (value) => {
    // eslint-disable-next-line
    let selected = this.data.topics.filter(val => val.id == value)[0];
    if (this.data.panes.filter(element => element.title === selected.title).length > 0) {
      return message.error('Duplicated topic.');
    }
    Object.values(this.data.panes).forEach((element, i) => {
      if (element.key === this.data.activeKey) {
        this.data.panes[i].title = selected.title;
        this.data.newAchievementItem.topic[i].title = selected.title;
        this.data.newAchievementItem.topic[i].id = selected.id;
      }
    });
    this.setState({ didTabChange: true });
  }

  onAddClick = () => {
    console.log(this.data.newAchievementItem);
    var formCheck = true;
    Object.keys(this.data.newAchievementItem).map(async (key) => {
      if (key === 'topic' && this.data.newAchievementItem[key].length === 0) formCheck = false;
      else if (key === 'topic' && this.data.newAchievementItem[key].filter(val => val.issuer === '').length > 0) formCheck = false;
      else if (! this.data.newAchievementItem[key]) formCheck = false;
    });
    if (formCheck) this.setState({ qrVisible: true }, () => this.data.newAchievementItem = { title: '', topic: [], explanation: '', reward: '' });
    else message.error('Select at least 1 topic');
  }

  getModalAchievementDetail(record, index) {
    Modal.info({
      width: '50%',
      maskClosable: true,
      title: record.title,
      content: (
        <div>
          <h5 style={{ marginBottom: '10px', float: 'right' }}>Registered on: {record.createdAt}</h5><br />
          <h4 style={{ margin: '10px 0 0 0' }}>Address: {record.id}</h4><hr />
          <h4 style={{ margin: '10px 0 0 0' }}>Explanation: {record.explanation}</h4><hr />
          <h4 style={{ margin: '10px 0 0 0' }}>Reward: {record.reward}</h4> <hr />
          <h4 style={{ margin: '10px 0' }}>Creator: Metadium / {record.creator}</h4> <hr />
          <center><h3 style={{ marginTop: '30px' }}>Required Topics</h3></center>
          <Table size='small' rowKey='id' columns={detailColumns} dataSource={record.claimTopics} />
        </div>
      ),
      onOk() {}
    });
  }

  getTopicTabs() {
    return <Form.Item>
      <Tabs
        onChange={this.onTabsChange}
        activeKey={this.data.activeKey}
        type='editable-card'
        onEdit={this.onTabsEdit}>
          {this.state.didTabChange && this.data.panes.map(pane =>
            <Tabs.TabPane tab={pane.title} key={pane.key} closable={pane.closable}>
              <Select
                showSearch
                style={{ width: '100%' }}
                placeholder='Select a Topic'
                optionFilterProp='children'
                onChange={this.onTopicClick}
                filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
              >
                {this.data.originClaimTopics}
              </Select>
              <Input id='issuer' onChange={this.updateNewAchieveInfo} placeholder='Enter Meta ID of Issuer' />
            </Tabs.TabPane>)
          }
      </Tabs>
    </Form.Item>
  }

  getModalAddAchievement() {
    return <Modal
      width='40%'
      title='Add New Achievement'
      visible={this.state.addModalVisible}
      onOk={this.onAddClick}
      okText='Add'
      onCancel={() => this.setState({ addModalVisible: false, qrVisible: false })}
      closable={false}
      >
      {this.state.qrVisible ?
        <div><center>
          <h1>Scan QR Code to Add New Achievement</h1>
          <SendTransaction
            id='sendTransaction'
            request={this.props.contracts.achievementManager.createAchievement(
              this.data.newAchievementItem.topic.map(val => val.id),
              this.data.newAchievementItem.topic.map(val => val.issuer),
              Buffer.from(this.data.newAchievementItem.title),
              Buffer.from(this.data.newAchievementItem.explanation),
              web3.utils.toWei(this.data.newAchievementItem.reward.toString(), 'ether'),
              'uri')}
            usage='createAchievement'
            service='metagate'
            callbackUrl='none'
            qrsize={256}
          />
          <h2 style={{ marginTop: '6%' }} >Title: {this.data.newAchievementItem.title}</h2>
          <h2>Reward: {this.data.newAchievementItem.reward} META</h2>
        </center></div>
        :
        <div>
          <Row>
            <Col span={12}>
              Title<br />
              <Input id='title' onChange={this.updateNewAchieveInfo} placeholder='Input Title' />
            </Col>
            <Col span={11} offset={1}>
              Reward<br />
              <Input id='reward' type='number' onChange={this.updateNewAchieveInfo} placeholder='Input Reward' addonAfter='META' />
            </Col>
          </Row>
          <p style={{ float: 'right', color: 'red' }}>* Reward needs to be higher than 5</p>
          <Form layout='vertical' style={{ margin: '30px 0' }}>
            Explanation<br />
            <Input id='explanation' onChange={this.updateNewAchieveInfo} placeholder='Enter Explanation (max. 32 bytes)' />
            <p /><hr />Required Claim Topics<p />
            {this.getTopicTabs()}
          </Form>
        </div>
        }
    </Modal>
  }

  render() {
    return (
      <div>
        <div>
          <Button
            type='primary'
            size='large'
            onClick={() => this.setState({ addModalVisible: true })}>
            Add New Achievement
          </Button>
          <Input.Search
            placeholder='Search by Creator, No., Keyword'
            onChange={e => this.onSearch(e.target.value)}
            onSearch={value => this.onSearch(value)}
            enterButton
            style={{ width: '50%', float: 'right', marginBottom: '20px' }}
          />
        </div>
        <Progress type='line' percent={ +Number(this.data.loadedAchieveCnt / this.data.totalAchieveCnt * 100).toFixed(2) } /><br /><br />
        <Table
          // rowKey={record => record.uid}
          onRow={(record, index) => ({ onClick: () => this.getModalAchievementDetail(record, index) })}
          columns={tableColumns}
          dataSource={ this.data.items }
        />
        {this.state.getTopicInfo && this.getModalAddAchievement()}
      </div>
    );
  }
}

export {Achievement}