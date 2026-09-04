import { ReactFlowProvider } from '@xyflow/react';
import Flow from './Flow';

const App = () => {

  return (
    <ReactFlowProvider>
      <main className="main" >
        <h1>Composer UI</h1>
        <Flow />
      </main>
    </ReactFlowProvider>
  )
}

export default App
