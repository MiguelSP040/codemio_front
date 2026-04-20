import { useCallback, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import toast from '../../../utils/toast';
import ConfirmModal from '../../ui/ConfirmModal/ConfirmModal';
import './FileUpload.css';

const DEFAULTS = {
  acceptedExtensions: ['.java', '.zip'],
  maxFileSizeMB: 10,
  maxZipSizeMB: 10,
  maxTotalSizeMB: 30,
  allowMixed: false,
  multiple: true,
};

const REMOVE_ANIM_MS = 220;

/* ===== Helpers ===== */
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getExtension(filename) {
  const idx = filename.lastIndexOf('.');
  if (idx < 0) return '';
  return filename.slice(idx).toLowerCase();
}

function fileKey(file) {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

function isZip(file) {
  return getExtension(file.name) === '.zip';
}

function isJava(file) {
  return getExtension(file.name) === '.java';
}

/* ===== Icons ===== */
function JavaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M10 13c-1 0-2 .5-2 2s1 2 2 2 2-.5 2-2" />
      <path d="M14 11v4.5a1.5 1.5 0 0 1-1.5 1.5" />
    </svg>
  );
}

function ZipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="11" x2="12" y2="13" />
      <line x1="12" y1="15" x2="12" y2="17" />
      <line x1="12" y1="19" x2="12" y2="19.5" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

/* ===== Validation per file ===== */
function validateFile(file, { acceptedExtensions, maxFileSizeMB, maxZipSizeMB }) {
  const ext = getExtension(file.name);

  if (!acceptedExtensions.includes(ext)) {
    return `Formato no soportado (${ext || 'sin extensión'})`;
  }
  if (file.size === 0) {
    return 'El archivo está vacío';
  }
  const limitMB = ext === '.zip' ? maxZipSizeMB : maxFileSizeMB;
  if (file.size > limitMB * 1024 * 1024) {
    return `Excede el tamaño máximo (${limitMB} MB)`;
  }
  return '';
}

/* ===== addFiles helpers ===== */
function isFolderLike(file) {
  // Folders arrive from DnD with size=0 and no type/extension.
  return file.size === 0 && !file.type && !getExtension(file.name);
}

function checkMixedRejection(file, { allowMixed, hasZip, hasJava }) {
  if (allowMixed) return null;
  const fileIsZip = isZip(file);
  const fileIsJava = isJava(file);
  if (fileIsZip && hasJava) return 'mixed';
  if (fileIsJava && hasZip) return 'mixed';
  if (fileIsZip && hasZip) return 'multipleZip';
  return null;
}

function getRejectionBucket(rejection) {
  if (rejection === 'mixed') return 'mixedRejected';
  if (rejection === 'multipleZip') return 'multipleZipRejected';
  return null;
}

function updateTypeFlags(file, state) {
  if (isZip(file)) state.hasZip = true;
  if (isJava(file)) state.hasJava = true;
}

function classifyIncoming(incoming, existingEntries, opts) {
  const activeExisting = existingEntries.filter((e) => !e.removing);
  const state = {
    existingKeys: new Set(activeExisting.map((e) => fileKey(e.file))),
    hasZip: activeExisting.some((e) => isZip(e.file)),
    hasJava: activeExisting.some((e) => isJava(e.file)),
  };
  const existingCount = activeExisting.length;
  const counts = {
    duplicates: 0,
    folderRejected: 0,
    mixedRejected: 0,
    multipleZipRejected: 0,
    invalidCount: 0,
    addedCount: 0,
  };
  const toAdd = [];
  let acceptedSoFar = 0;

  for (const file of incoming) {
    if (isFolderLike(file)) {
      counts.folderRejected += 1;
      continue;
    }
    const key = fileKey(file);
    if (state.existingKeys.has(key)) {
      counts.duplicates += 1;
      continue;
    }
    state.existingKeys.add(key);

    if (!opts.multiple && existingCount + acceptedSoFar >= 1) break;

    const rejectionBucket = getRejectionBucket(
      checkMixedRejection(file, {
        allowMixed: opts.allowMixed,
        hasZip: state.hasZip,
        hasJava: state.hasJava,
      }),
    );
    if (rejectionBucket) {
      counts[rejectionBucket] += 1;
      continue;
    }

    updateTypeFlags(file, state);

    const error = validateFile(file, opts);
    if (error) counts.invalidCount += 1;
    else counts.addedCount += 1;

    toAdd.push({ file, error, id: key, removing: false, entering: true });
    acceptedSoFar += 1;
  }

  return { toAdd, counts };
}

function emitAddFilesToasts(counts) {
  if (counts.addedCount > 0) {
    toast.success(
      counts.addedCount === 1 ? '1 archivo agregado' : `${counts.addedCount} archivos agregados`,
    );
  }
  if (counts.folderRejected > 0) {
    toast.error('Las carpetas no son soportadas. Selecciona archivos o un .zip.');
  }
  if (counts.mixedRejected > 0) {
    toast.warning('No puedes combinar archivos .java con un .zip.');
  }
  if (counts.multipleZipRejected > 0) {
    toast.warning('Solo puedes subir un archivo .zip a la vez.');
  }
  if (counts.duplicates > 0) {
    toast.info(
      counts.duplicates === 1
        ? 'Se omitió 1 archivo duplicado'
        : `Se omitieron ${counts.duplicates} archivos duplicados`,
    );
  }
  if (counts.invalidCount > 0) {
    toast.error(
      counts.invalidCount === 1
        ? '1 archivo no cumple con los requisitos'
        : `${counts.invalidCount} archivos no cumplen con los requisitos`,
    );
  }
}

/* ===== Main component ===== */
export default function FileUpload({
  onFilesReady,
  onFilesChanged,
  onClear,
  onSubmit,
  acceptedExtensions = DEFAULTS.acceptedExtensions,
  maxFileSizeMB = DEFAULTS.maxFileSizeMB,
  maxZipSizeMB = DEFAULTS.maxZipSizeMB,
  maxTotalSizeMB = DEFAULTS.maxTotalSizeMB,
  allowMixed = DEFAULTS.allowMixed,
  multiple = DEFAULTS.multiple,
  disabled = false,
  projectName = '',
  submitLabel = 'Subir archivos',
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const dragCounter = useRef(0);

  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const visibleFiles = files.filter((entry) => !entry.removing);
  const viewMode = visibleFiles.length === 0 ? 'dropzone' : 'filelist';
  const totalBytes = visibleFiles.reduce((acc, entry) => acc + entry.file.size, 0);
  const validFiles = visibleFiles.filter((entry) => !entry.error).map((entry) => entry.file);
  const hasValidFiles = validFiles.length > 0;
  const totalExceeds = totalBytes > maxTotalSizeMB * 1024 * 1024;

  const notifyChanged = useCallback(
    (next) => {
      if (typeof onFilesChanged === 'function') {
        onFilesChanged(next.filter((e) => !e.removing && !e.error).map((e) => e.file));
      }
    },
    [onFilesChanged],
  );

  function resolveAccept() {
    return acceptedExtensions.join(',');
  }

  function addFiles(incomingList) {
    const incoming = Array.from(incomingList || []);
    if (incoming.length === 0) return;

    const { toAdd, counts } = classifyIncoming(incoming, files, {
      acceptedExtensions,
      maxFileSizeMB,
      maxZipSizeMB,
      allowMixed,
      multiple,
    });

    const next = [...files, ...toAdd];
    setFiles(next);
    notifyChanged(next);
    emitAddFilesToasts(counts);
  }

  function finalizeRemoval(id, onDone) {
    setFiles((curr) => {
      const next = curr.filter((e) => e.id !== id);
      notifyChanged(next);
      return next;
    });
    if (typeof onDone === 'function') onDone();
  }

  function scheduleRemoval(id, onDone) {
    // Mark as removing so CSS plays the fade-out, then drop from state.
    setFiles((curr) => curr.map((e) => (e.id === id ? { ...e, removing: true } : e)));
    setTimeout(() => finalizeRemoval(id, onDone), REMOVE_ANIM_MS);
  }

  function removeFile(id) {
    const entry = files.find((e) => e.id === id);
    scheduleRemoval(id, () => {
      if (entry) {
        toast.message('Archivo eliminado', { duration: 1800 });
      }
    });
  }

  function clearAll() {
    const ids = files.filter((e) => !e.removing).map((e) => e.id);
    if (ids.length === 0) return;

    setFiles((curr) => curr.map((e) => ({ ...e, removing: true })));
    setTimeout(() => {
      setFiles([]);
      dragCounter.current = 0;
      setIsDragging(false);
      if (inputRef.current) inputRef.current.value = '';
      if (typeof onClear === 'function') onClear();
      if (typeof onFilesChanged === 'function') onFilesChanged([]);
      toast.info('Selección limpiada');
    }, REMOVE_ANIM_MS);
  }

  function handleClearRequest() {
    if (visibleFiles.length === 0) return;
    setConfirmOpen(true);
  }

  function handleConfirmClear() {
    setConfirmOpen(false);
    clearAll();
  }

  function handleSubmit() {
    if (!hasValidFiles || totalExceeds) return;
    if (typeof onSubmit === 'function') {
      onSubmit(validFiles);
    } else if (typeof onFilesReady === 'function') {
      onFilesReady(validFiles);
    }
  }

  /* ----- DnD handlers ----- */
  function handleDragEnter(e) {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }

  function handleDragOver(e) {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  }

  function handleDragLeave(e) {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }

  function handleDrop(e) {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      addFiles(e.dataTransfer.files);
    }
  }

  /* ----- Keyboard / click triggers ----- */
  function openPicker() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function handleZoneKeyDown(e) {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  }

  function handleInputChange(e) {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  }

  const zoneClass = [
    'fu-dropzone',
    isDragging ? 'fu-dropzone--active' : '',
    disabled ? 'fu-dropzone--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="fu-root" aria-label="Subir archivos">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className="fu-hidden-input"
        accept={resolveAccept()}
        multiple={multiple}
        disabled={disabled}
        onChange={handleInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />

      {viewMode === 'dropzone' ? (
        <div
          className={zoneClass}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openPicker}
          onKeyDown={handleZoneKeyDown}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled || undefined}
          aria-label={
            projectName
              ? `Subir archivos al proyecto ${projectName}`
              : 'Arrastra archivos o haz clic para seleccionar'
          }
        >
          <div className="fu-dropzone-icon" aria-hidden="true">
            <UploadIcon />
          </div>
          <p className="fu-dropzone-title">
            {isDragging ? 'Suelta para agregar' : 'Arrastra tus clases .java o un .zip'}
          </p>
          <p className="fu-dropzone-sub">
            o <span className="fu-dropzone-link">selecciona desde tu equipo</span>
          </p>
          {projectName && (
            <p className="fu-dropzone-project">
              Agregar archivos a <strong>{projectName}</strong>
            </p>
          )}
          <ul className="fu-dropzone-rules" aria-hidden="true">
            <li>Puedes agregar varias clases .java del mismo proyecto, o un .zip con todo el código</li>
            <li>Formatos aceptados: {acceptedExtensions.join(', ')}</li>
            <li>
              Hasta {maxFileSizeMB} MB por .java y {maxZipSizeMB} MB por .zip (total {maxTotalSizeMB} MB)
            </li>
          </ul>
        </div>
      ) : (
        <div
          className={zoneClass + ' fu-dropzone--compact'}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openPicker}
          onKeyDown={handleZoneKeyDown}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Arrastra mas archivos o haz clic para agregar"
        >
          <span className="fu-dropzone-compact-icon" aria-hidden="true">
            <UploadIcon />
          </span>
          <span className="fu-dropzone-compact-text">
            {isDragging ? 'Suelta para agregar' : 'Arrastra mas clases .java o haz clic para agregar'}
          </span>
        </div>
      )}

      {files.length > 0 && (
        <div className="fu-list-wrap">
          <div className="fu-list-header">
            <div>
              <p className="fu-list-title">
                {visibleFiles.length === 1 ? '1 archivo' : `${visibleFiles.length} archivos`}
                {validFiles.length !== visibleFiles.length && (
                  <span className="fu-list-count-badge">
                    {validFiles.length} valido{validFiles.length === 1 ? '' : 's'}
                  </span>
                )}
              </p>
              <p className={`fu-list-sub${totalExceeds ? ' fu-list-sub--over' : ''}`}>
                Total {formatSize(totalBytes)} / {maxTotalSizeMB} MB
              </p>
            </div>
            <button
              type="button"
              className="fu-clear-btn"
              onClick={handleClearRequest}
              disabled={disabled || visibleFiles.length === 0}
              aria-label="Quitar todos los archivos"
            >
              <TrashIcon />
              Limpiar
            </button>
          </div>

          <ul className="fu-list" aria-label="Archivos seleccionados">
            {files.map((entry) => {
              const itemIsZip = isZip(entry.file);
              const hasError = Boolean(entry.error);
              const cls = [
                'fu-item',
                hasError ? 'fu-item--error' : '',
                entry.removing ? 'fu-item--removing' : 'fu-item--entering',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <li key={entry.id} className={cls}>
                  <span
                    className={`fu-item-icon${itemIsZip ? ' fu-item-icon--zip' : ''}`}
                    aria-hidden="true"
                  >
                    {itemIsZip ? <ZipIcon /> : <JavaIcon />}
                  </span>
                  <div className="fu-item-info">
                    <p className="fu-item-name" title={entry.file.name}>
                      {entry.file.name}
                    </p>
                    <p className="fu-item-meta">
                      <span>{formatSize(entry.file.size)}</span>
                      {hasError ? (
                        <span className="fu-item-error">· {entry.error}</span>
                      ) : (
                        <span className="fu-item-ok">
                          <CheckIcon /> Valido
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="fu-item-remove"
                    onClick={() => removeFile(entry.id)}
                    disabled={disabled || entry.removing}
                    aria-label={`Quitar ${entry.file.name}`}
                  >
                    <TrashIcon />
                  </button>
                </li>
              );
            })}
          </ul>

          {multiple && (
            <button
              type="button"
              className="fu-add-more"
              onClick={openPicker}
              disabled={disabled}
            >
              <PlusIcon />
              Agregar mas archivos
            </button>
          )}

          <button
            type="button"
            className="fu-submit"
            onClick={handleSubmit}
            disabled={disabled || !hasValidFiles || totalExceeds}
            aria-disabled={disabled || !hasValidFiles || totalExceeds}
          >
            <SendIcon />
            {submitLabel}
            {hasValidFiles && !totalExceeds && (
              <span className="fu-submit-badge">{validFiles.length}</span>
            )}
          </button>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        variant="danger"
        title="Eliminar todos los archivos"
        message="Eliminar todos los archivos seleccionados? Esta accion no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleConfirmClear}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

FileUpload.propTypes = {
  onFilesReady: PropTypes.func,
  onFilesChanged: PropTypes.func,
  onClear: PropTypes.func,
  onSubmit: PropTypes.func,
  acceptedExtensions: PropTypes.arrayOf(PropTypes.string),
  maxFileSizeMB: PropTypes.number,
  maxZipSizeMB: PropTypes.number,
  maxTotalSizeMB: PropTypes.number,
  allowMixed: PropTypes.bool,
  multiple: PropTypes.bool,
  disabled: PropTypes.bool,
  projectName: PropTypes.string,
  submitLabel: PropTypes.string,
};
