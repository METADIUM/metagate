import React from 'react';
import { Table, Input, Modal, Button, Radio, Form } from 'antd';

// Test data
var storedData = [];
var newTopicData = [];
var issuerArr = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
var titleArr = ['title1', 'title2', 'title3', 'title4','title5', 'title6'];
var explanationArr = ['explanation1', 'explanation2','explanation3','explanation4', 'explanation5','explanation6'];

function setTestData() {
  for (var i=0; i < 20; i++) {
    // Get data (hardcoding)
    storedData.push({
      topicID: Math.floor((Math.random() * 2000)+1),
      issuer: issuerArr[Math.floor(Math.random() * 6)],
      title: titleArr[Math.floor((Math.random() * 6))],
      explanation: explanationArr[Math.floor(Math.random() * 6)],
      registerDate: Date.now() - Math.floor((Math.random()*10)),
    });
  }
}

const columns = [
  {
    title: 'TopicID',
    dataIndex: 'topicID',
    key: 'topicID',
    width: '10%',
  },
  {
    title: 'Issuer',
    dataIndex: 'issuer',
    key: 'issuer',
    width: '10%',
  },
  {
    title: 'Title',
    dataIndex: 'title',
    key: 'title',
    width: '15%',
  },
  {
    title: 'Explanation',
    dataIndex: 'explanation',
    key: 'explanation',
    width: '30%',
  },
  {
    title: 'Registered on',
    dataIndex: 'registerDate',
    key: 'registerDate',
  }
];

class Topic extends React.Component {
  state = {
    data: [],
    topicID: '',
    issuer: '',
    title: '',
    explanation: '',
    newTopicId: '',
    newTitle: '',
    newExplanation: '',
    registerDate: '',
    addModalVisible: false,
    qrVisible: false
  };

  constructor() {
    super();
    setTestData();
  }

  componentWillMount() {
    this.setState({data: storedData});
  }

  handleSorting = (e) => {
    var sortData=[];
    switch(e.target.value) {
      case '1':
        // All topic
        this.setState({data: storedData});
        break;
      case '2':
        // Pre-fixed topic (1 ~ 1024)
        storedData.forEach(function(element) {
          if(Object.values(element)[0]<1025) {
            sortData.push(element);
          }
        });
        this.setState({data: sortData});
        break;
      case '3':
        // Added topic (1025 ~)
        storedData.forEach(function(element) {
          if(Object.values(element)[0]>1024) {
            sortData.push(element);
          }
        });
        this.setState({data: sortData});
        break;
      default: break;
    }
  }

  handleChange = (e) => {
    newTopicData[e.target.id] = e.target.value;
  }

  onSearch(value) {
    // Reset search
    if (value === '') {
      this.setState({data: storedData});
      return;
    }

    // Search with given value
    var searchData = [];
    storedData.forEach(function(element) {
      if(Object.values(element).indexOf(value) > -1) searchData.push(element);
    });
    this.setState({data: searchData});
  }

  getModalTopicDetail(record) {
    Modal.info({
      width: '70%',
      maskClosable: true,
      title: record.title,
      content: (
        <div>
          <h5 style={{ float: 'right' }}>Registered on: {record.registerDate}</h5>
          <h3 style={{ margin: '10px 0 0 0' }}>{record.explanation}</h3>
          <h3 style={{ margin: '10px 0' }}>Creator(Title / MetaID) : {record.issuer} / 0x7304f14b0909640acc4f6a192381091eb1f37701</h3>
        </div>
      ),
      onOk() {}
    });
  }

  getModalAddTopic() {
    return <Modal
      width='70%'
      title='Add New Topic'
      visible={this.state.addModalVisible}
      okText='Add'
      onOk={() => this.setState({ qrVisible: true })}
      onCancel={() => this.setState({ addModalVisible: false, qrVisible: false })}
      closable={false}
      >
        {this.state.qrVisible ?
          'will be QR'
          :
          <Form layout='vertical'>
            <Form.Item label='Title'>
              <Input
                onChange={this.handleChange}
                id='title'
                placeholder='Input Title'
              />
            </Form.Item>
            <Form.Item label='Topic No'>
              <Input
                onChange={this.handleChange}
                id='topic'
                placeholder='Input Topic No or'
              />
              <a style={{ float: 'right', color: 'red' }}>* No. in use / choose different No.</a>
            </Form.Item>
            <Form.Item label='Explanation'>
              <Input.TextArea
                onChange={this.handleChange} 
                placeholder='Enter Explanation (max. 32 bytes)'
                autosize={{ minRows: 2, maxRows: 6 }}
                id='explanation'
              />
            </Form.Item>
          </Form>
        }
    </Modal>;
  }

  render() {
    return (
      <div>
        <div>
          <Button
            type='primary'
            size='large'
            onClick={() => this.setState({ addModalVisible: true })}>Add New Topic</Button>
          <Input.Search
            placeholder='Search by Creator, No., Keyword'
            onSearch={value => this.onSearch(value)}
            enterButton
            style={{ width: 500, float: 'right', marginBottom: '20px' }}
          />
        </div>
        <Radio.Group style={{margin: '10px 10px 0 0'}} onChange={this.handleSorting}>
          <Radio.Button value='1'>All</Radio.Button>
          <Radio.Button value='2'>Pre-fixed</Radio.Button>
          <Radio.Button value='3'>Added</Radio.Button>
        </Radio.Group>
        <br />
        <Table
          rowKey={record => record.uid}
          onRow={(record, index) => ({
            onClick: () => { this.getModalTopicDetail(record); }
          })}
          columns={columns}
          dataSource={this.state.data}
        />
        {this.getModalAddTopic()}
      </div>
    );
  }
}

export {Topic};