"use client";
"use client";
import PullRequests from "@components/repo/PullRequests";
import CodeContributions from "@components/repo/CodeContributions";
import IssueTracking from "@components/repo/IssueTracking";
import { getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const NavItem = ({ name }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: 'NAV_ITEM',
      item: { name },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }));

    return (
      <div
        ref={drag}
        style={{
          opacity: isDragging ? 0.5 : 1,
          cursor: 'pointer',
          marginBottom: '8px',
          padding: '8px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#fff',
        }}
      >
        {name}
      </div>
    );
  };

  const DropZone = ({ onDrop }) => {
    const [{ canDrop, isOver }, drop] = useDrop(() => ({
      accept: 'NAV_ITEM',
      drop: (item) => onDrop(item),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }));

    let backgroundColor = '#f0f0f0';
    if (isOver && canDrop) {
      backgroundColor = 'lightgreen';
    } else if (canDrop) {
      backgroundColor = 'lightyellow';
    }

    return (
      <div ref={drop} style={{ width: '100%', minHeight: '200px', backgroundColor }}>
        {isOver && <p>Drop here</p>}
      </div>
    );
  };

  export default function RepoPage({ params }) {
    const owner = params.owner;
    const repo = params.repo;

    const [userAccessToken, setUserAccessToken] = useState("");
    const [droppedComponent, setDroppedComponent] = useState(null);

    useEffect(() => {
      async function getInfo() {
        const info = await getSession();
        if (info) {
          setUserAccessToken(info.accessToken);
        }
      }

      getInfo().catch((err) => {
        console.error(err);
      });
    }, []);

    const handleDrop = (item) => {
      setDroppedComponent(item.name);
    };

    return (
      <DndProvider backend={HTML5Backend}>
        <div className="flex">
          <div style={{ width: '20%', marginRight: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
              <NavItem name="Pull Requests" />
              <NavItem name="Code Contributions" />
              <NavItem name="Issue Tracking" />
            </div>
          </div>
          <div className="mt-4 flex flex-col items-center" style={{ width: '80%' }}>
            <p className="mb-4 text-5xl">
              Info for {owner}/{repo}
            </p>
            <DropZone onDrop={handleDrop} />
            <div>
              {droppedComponent === "Code Contributions" && (
                <CodeContributions owner={owner} repo={repo} userAccessToken={userAccessToken} />
              )}
              {droppedComponent === "Pull Requests" && (
                <PullRequests owner={owner} repo={repo} userAccessToken={userAccessToken} />
              )}
              {droppedComponent === "Issue Tracking" && (
                <IssueTracking owner={owner} repo={repo} userAccessToken={userAccessToken} />
              )}
            </div>
          </div>
        </div>
      </DndProvider>
    );
  }
