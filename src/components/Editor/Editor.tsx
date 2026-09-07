import { useDocumentStore } from '../../store/useDocumentStore';
import TopBar from './TopBar';
import PageTray from './PageTray';
import Stage from './Stage';
import RedactionLog from './RedactionLog';
import Toolbar from './Toolbar';
import ExportOverlay from './ExportOverlay';
import styles from './Editor.module.css';

export default function Editor() {
  const status = useDocumentStore((s) => s.status);

  return (
    <div className={styles.shell}>
      <TopBar />
      <PageTray />
      <Stage />
      <RedactionLog />
      <Toolbar />
      {status === 'exporting' && <ExportOverlay />}
    </div>
  );
}
