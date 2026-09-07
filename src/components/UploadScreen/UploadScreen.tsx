import { useCallback, useRef, useState, type DragEvent } from 'react';
import { useDocumentStore } from '../../store/useDocumentStore';
import DocumentMark from './DocumentMark';
import styles from './UploadScreen.module.css';

const FEATURES = [
  {
    title: 'Draw the box yourself',
    body: 'Drag a rectangle over anything on the page — a name, a photo, a whole paragraph.',
  },
  {
    title: 'Or let Smart Detect find it',
    body: 'Emails, phone numbers, SSNs, and card numbers get flagged automatically for you to accept.',
  },
  {
    title: 'Download a clean copy',
    body: 'Each page is flattened to an image before export, so text under a box cannot be recovered.',
  },
];

export default function UploadScreen() {
  const status = useDocumentStore((s) => s.status);
  const errorMessage = useDocumentStore((s) => s.errorMessage);
  const fileName = useDocumentStore((s) => s.fileName);
  const loadFile = useDocumentStore((s) => s.loadFile);
  const reset = useDocumentStore((s) => s.reset);

  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        useDocumentStore.setState({
          status: 'error',
          errorMessage: `"${file.name}" doesn't look like a PDF. Choose a .pdf file.`,
        });
        return;
      }
      void loadFile(file);
    },
    [loadFile],
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile],
  );

  const isLoading = status === 'loading';
  const isError = status === 'error';

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.wordmark}>
          <span className={styles.wordmarkBar} aria-hidden="true" />
          Redact
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.mark}>
          <DocumentMark />
        </div>

        <div className={styles.copy}>
          <p className={styles.eyebrow}>PDF · in your browser</p>
          <h1 className={styles.headline}>
            Black out what shouldn&apos;t <em>leave the room.</em>
          </h1>
          <p className={styles.subhead}>
            Redact removes sensitive text and images from a PDF, then hands you back a clean
            copy. Nothing is uploaded anywhere — the file never leaves this device.
          </p>

          <div
            className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            {isLoading ? (
              <p className={styles.status}>Opening {fileName}…</p>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.chooseButton}
                  onClick={() => inputRef.current?.click()}
                >
                  Choose a PDF
                </button>
                <p className={styles.dropHint}>or drop it here</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className={styles.hiddenInput}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          {isError && (
            <p className={styles.error} role="alert">
              {errorMessage}
              <button type="button" className={styles.retry} onClick={reset}>
                Try another file
              </button>
            </p>
          )}
        </div>
      </section>

      <section className={styles.features} aria-label="What Redact does">
        {FEATURES.map((f) => (
          <div className={styles.feature} key={f.title}>
            <span className={styles.featureMark} aria-hidden="true" />
            <h2 className={styles.featureTitle}>{f.title}</h2>
            <p className={styles.featureBody}>{f.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
