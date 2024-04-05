"use client";
import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { Avatar, Center, Container, Grid, Group, Stack, Text, Title } from "@mantine/core";
import { IconArrowRight, IconInfoSquareRounded, IconMapPin } from "@tabler/icons-react";

export default function UserPage({ params }) {
    const user = params.user;
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

    const [userAccessToken, setUserAccessToken] = useState("");
    const [userInfo, setUserInfo] = useState({});
    const [isLoading, setIsLoading] = useState(true);

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

    useEffect(() => {
        if (!userAccessToken) return;

        fetch(`${BACKEND_URL}/get-user?token=${userAccessToken}&user=${user}`)
            .then((res) => res.json())
            .then((data) => {
                setUserInfo(data);
                setIsLoading(false);
            });
    }, [BACKEND_URL, user, userAccessToken]);

    return isLoading ? (
        <p>Loading...</p>
    ) : (
        <Stack className="mt-7" gap="xs">
            <Group justify="space-between" className="mb-4">
                <div>
                    <Title order={1}>{userInfo.name}</Title>
                    <Text c="dimmed">{userInfo.login}</Text>
                </div>
                <Avatar src={userInfo.avatar_url} alt={userInfo.name} size="xl" />
            </Group>
            <Group>
                <IconInfoSquareRounded stroke={1.5} />
                <Text>{userInfo.bio}</Text>
            </Group>
            <Group>
                <IconMapPin stroke={1.5} />
                <Text>{userInfo.location}</Text>
            </Group>
            <Center mt="lg" mb="md">
                <Title order={3}>Repositories</Title>
            </Center>
            <Container size="xl">
                <Grid gutter="lg">
                    {userInfo.repos.map((repo) => {
                        return (
                            <Grid.Col key={repo.name} span={{ base: 12, md: 6, lg: 4 }}>
                                <a
                                    href={repo.html_url}
                                    target="_blank"
                                    className="py-1.5 px-8 w-full h-14 inline-flex items-center justify-between rounded text-xl bg-[#12b88626] text-[#63e6be] hover:bg-[#12b88633]"
                                >
                                    {repo.name}
                                    <IconArrowRight stroke={1.5} />
                                </a>
                            </Grid.Col>
                        );
                    })}
                </Grid>
            </Container>
        </Stack>
    );
}
