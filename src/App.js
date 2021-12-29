import { useEffect, useState } from 'react';
import readXlsxFile from 'read-excel-file';
import './App.css';

function parseXlsArrayToObject (data, keyIndex = 0) {
  const keys = data[keyIndex]

  let result = []
  for (let idx = 0; idx < data.length; idx++) {
    if (idx === 0) continue
    const arrItem = data[idx]

    let itemObject = {}
    arrItem.forEach((value, index) => {
      itemObject[keys[index]] = value
    })

    result.push(itemObject)
  }

  return result
}

function compare (sqTable, jzTable, rowName) {
  return sqTable.map(column => {
    const item = jzTable.find(i => i[rowName] === column[rowName])
    return item ? { ...column, '接种时间': item['接种时间'] } : 0
  }).filter(i => !!i).sort((i, j) => i['接种时间'] > j['接种时间'] ? -1 : 1)
}

const Steps = ['请在左侧选择表格', '正在读取接种表...', '正在读取社区表...', '正在对比数据...']
function Progress (props) {
  const { step } = props
  return (
    <div className='progress'>
      <div className='desc'>{Steps[step]}</div>
      <div className='bar'>
        <div className='active' style={{ width: `${100 * step / Steps.length}%`}}></div>
      </div>
    </div>
  )
}

function App() {
  const [step, setStep] = useState(0)
  const [jzb, setJZB] = useState()
  const [sqb, setSQB] = useState()
  
  const [colName, setColName] = useState('身份证号码')

  const [jzbSheets, setJZBSheets] = useState([])
  const [sqbSheets, setSQBSheets] = useState([])

  const [jzbSheet, setJZBSheet] = useState('')
  const [sqbSheet, setSQBSheet] = useState('')

  const [result, setResult] = useState([])

  const selectJZB = e => setJZB(e.target.files[0])
  const selectSQB = e => setSQB(e.target.files[0])
  
  const enabled = jzbSheet && sqbSheet

  const submit = () => {
    if (enabled) {
      setStep(1)
      let jzbData = [], sqbData = []
      readXlsxFile(jzb, { sheet: jzbSheet }).then(rows => {
        jzbData = parseXlsArrayToObject(rows)
        setStep(2)
        return readXlsxFile(sqb, { sheet: sqbSheet })
      }).then(rows => {
        setStep(3)
        sqbData = parseXlsArrayToObject(rows)
        setResult(compare(sqbData, jzbData, colName))
        setStep(0)
      })
    }
  }

  useEffect(() => {
    if (jzb) {
      readXlsxFile(jzb, { getSheets: true }).then(sheets => {
        setJZBSheets(sheets.map(s => s.name))
      })
    }
  }, [jzb])

  useEffect(() => {
    if (sqb) {
      readXlsxFile(sqb, { getSheets: true }).then(sheets => {
        setSQBSheets(sheets.map(s => s.name))
      })
    }
  }, [sqb])

  return (
    <div className="App">
      <div className='left'>
        <div className='label'>
          <label>
            <input type='file' name='jzb' onChange={selectJZB} />
            <span>选择接种表</span>
            { jzb && <strong>{jzb.name}</strong> }
          </label>
          <ul className='sheets'>
            <li className='caption'>选择子表格：</li>
            { jzbSheets.map(s =>
              <li
                className={`option ${s === jzbSheet ? 'active' : ''}`}
                onClick={() => setJZBSheet(s)}
              >{s}</li>
            )}
          </ul>
        </div>
        <div className='label'>
          <label>
            <input type='file' name='sqb' onChange={selectSQB} />
            <span>选择社区表</span>
            { sqb && <strong>{sqb.name}</strong> }
          </label>
          <ul className='sheets'>
            <li className='caption'>选择子表格：</li>
            { sqbSheets.map(s =>
              <li
                className={`option ${s === sqbSheet ? 'active' : ''}`}
                onClick={() => setSQBSheet(s)}
              >{s}</li>
            )}
          </ul>
        </div>
        <div className={`submit ${enabled && step === 0 ? '' : 'disabled'}`}>
          <input style={{width: 90}} defaultValue={colName} type='text' onChange={e => setColName(e.target.value)} />
          <button onClick={submit}>开始对比</button>
        </div>
      </div>
      <div className='right'>
        <Progress step={step} />
        <div className='result'>
          <div className='caption'>对比结果：</div>
          <ul className='list'>
            <li className='caption' key='caption'>
              <div className='name'>姓名</div>
              <div className='identity'>身份证号码</div>
              <div className='date'>接种时间</div>
            </li>
            {result.map((r, index) =>
              <li key={index}>
                <div className='name'>{r['姓名']}</div>
                <div className='identity'>{r['身份证号码']}</div>
                <div className='date'>{r['接种时间']}</div>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
