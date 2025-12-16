declare module 'simple-peer' {
    import * as React from 'react';

    interface Options {
        initiator?: boolean;
        channelName?: string;
        channelConfig?: any;
        trickle?: boolean;
        stream?: MediaStream;
        config?: any;
        offerOptions?: any;
        answerOptions?: any;
        sdpTransform?: (sdp: string) => string;
        objectMode?: boolean;
    }

    interface SignalData {
        type: 'offer' | 'answer' | 'pranswer' | 'rollback';
        sdp?: any;
        candidate?: any;
    }

    class SimplePeer extends React.Component<any, any> {
        constructor(opts?: Options);
        signal(data: string | SignalData): void;
        send(data: string | ArrayBuffer | Blob | ArrayBufferView): void;
        destroy(err?: Error): void;
        replaceTrack(oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack, stream: MediaStream): void;
        addStream(stream: MediaStream): void;
        removeStream(stream: MediaStream): void;
        addTrack(track: MediaStreamTrack, stream: MediaStream): void;
        removeTrack(track: MediaStreamTrack, stream: MediaStream): void;

        on(event: 'signal', listener: (data: SignalData) => void): this;
        on(event: 'stream', listener: (stream: MediaStream) => void): this;
        on(event: 'data', listener: (data: any) => void): this;
        on(event: 'close', listener: () => void): this;
        on(event: 'error', listener: (err: Error) => void): this;
        on(event: 'connect', listener: () => void): this;
        on(event: string, listener: (...args: any[]) => void): this;
    }

    namespace SimplePeer {
        type Instance = SimplePeer;
    }

    export = SimplePeer;
}
