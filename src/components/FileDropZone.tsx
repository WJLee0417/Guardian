import { StatusBadge } from "./StatusBadge";

export function FileDropZone({
  fileName,
  fileStatus,
  onFileLoaded,
}: {
  fileName: string;
  fileStatus: string;
  onFileLoaded: (fileName: string) => void;
}) {
  return (
    <div
      className="fileZone"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) onFileLoaded(file.name);
      }}
    >
      <input
        type="file"
        accept=".mp3,.txt,.json"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileLoaded(file.name);
        }}
      />
      <div>
        <strong>{fileName}</strong>
        <span>{fileStatus}</span>
      </div>
      <StatusBadge variant="mock">실제 전화망 미연동</StatusBadge>
    </div>
  );
}
