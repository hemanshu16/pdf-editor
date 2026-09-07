import { useDocumentStore } from './store/useDocumentStore';
import UploadScreen from './components/UploadScreen/UploadScreen';
import Editor from './components/Editor/Editor';
import InkFilter from './components/InkFilter';

function App() {
  const status = useDocumentStore((s) => s.status);

  return (
    <>
      <InkFilter />
      {status === 'ready' || status === 'exporting' ? <Editor /> : <UploadScreen />}
    </>
  );
}

export default App;
