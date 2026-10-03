import { ReactFlowProvider } from '@xyflow/react';
import Flow from './Flow';
import './index.css';
import { Flow2 } from './Flow2';

const App = () => {

  return (
    <ReactFlowProvider>
      <main className="main" >
        <h1>Composer UI</h1>
        {/* <Flow /> */}
        <Flow2 />
      </main>
    </ReactFlowProvider>
  )
}

export default App










